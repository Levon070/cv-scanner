class CVScanner {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadUsage();
        this.checkUrlParams();
    }

    initializeElements() {
        this.form = document.getElementById('scan-form');
        this.cvTextarea = document.getElementById('cv-text');
        this.jobTextarea = document.getElementById('job-text');
        this.scanButton = document.getElementById('scan-button');
        this.buttonText = this.scanButton.querySelector('.button-text');
        this.spinner = this.scanButton.querySelector('.loading-spinner');
        this.errorMessage = document.getElementById('error-message');
        this.paymentPrompt = document.getElementById('payment-prompt');
        this.upgradeButton = document.getElementById('upgrade-button');
        this.results = document.getElementById('results');
        this.usageInfo = document.getElementById('usage-info');
        this.newAnalysisButton = document.getElementById('new-analysis');
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.upgradeButton.addEventListener('click', () => this.handleUpgrade());
        this.newAnalysisButton.addEventListener('click', () => this.resetForm());
    }

    async loadUsage() {
        try {
            const response = await fetch('/api/analysis/usage');
            const data = await response.json();
            
            if (data.needsPayment) {
                this.usageInfo.textContent = 'Gratis analyses gebruikt';
            } else {
                this.usageInfo.textContent = `${data.remaining} gratis analyses over`;
            }
        } catch (error) {
            this.usageInfo.textContent = 'Kon usage niet laden';
        }
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('success') === 'true') {
            this.showMessage('Betaling geslaagd! Je hebt nu onbeperkte toegang.', 'success');
            // Clear URL params
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        if (urlParams.get('canceled') === 'true') {
            this.showMessage('Betaling geannuleerd.', 'info');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        this.hideMessages();
        
        const cvText = this.cvTextarea.value.trim();
        const jobText = this.jobTextarea.value.trim();
        
        // Validatie
        if (!cvText || !jobText) {
            this.showError('Beide velden zijn verplicht.');
            return;
        }
        
        if (cvText.length < 50 || jobText.length < 50) {
            this.showError('CV en vacature moeten minimaal 50 karakters bevatten.');
            return;
        }
        
        this.setLoading(true);
        
        try {
            const response = await fetch('/api/analysis/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cvText, jobText })
            });
            
            const data = await response.json();
            
            if (response.status === 402) {
                // Payment required
                this.showPaymentPrompt();
                await this.loadUsage();
                return;
            }
            
            if (!response.ok) {
                throw new Error(data.error || 'Er ging iets fout');
            }
            
            this.showResults(data);
            await this.loadUsage();
            
        } catch (error) {
            this.showError(error.message || 'Er ging iets fout bij de analyse.');
        } finally {
            this.setLoading(false);
        }
    }

    async handleUpgrade() {
        try {
            this.upgradeButton.disabled = true;
            this.upgradeButton.textContent = 'Bezig...';
            
            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Kon betaling niet starten');
            }
            
            // Redirect to Stripe Checkout
            window.location.href = data.url;
            
        } catch (error) {
            this.showError(error.message);
            this.upgradeButton.disabled = false;
            this.upgradeButton.textContent = 'Upgrade nu - €9,99';
        }
    }

    showResults(data) {
        // Hide form and show results
        this.form.style.display = 'none';
        this.results.style.display = 'block';
        
        // Update score
        document.getElementById('score-number').textContent = data.score || '-';
        
        // Update analysis sections
        document.getElementById('skills-analysis').textContent = 
            data.onderbouwing?.skills || 'Geen skills analyse beschikbaar';
        document.getElementById('experience-analysis').textContent = 
            data.onderbouwing?.ervaring || 'Geen ervaring analyse beschikbaar';
        document.getElementById('education-analysis').textContent = 
            data.onderbouwing?.opleiding || 'Geen opleiding analyse beschikbaar';
        document.getElementById('other-analysis').textContent = 
            data.onderbouwing?.overig || 'Geen aanvullende analyse beschikbaar';
        
        // Update strong points
        const strongPoints = document.getElementById('strong-points');
        strongPoints.innerHTML = '';
        if (data.sterke_punten && data.sterke_punten.length > 0) {
            data.sterke_punten.forEach(point => {
                const li = document.createElement('li');
                li.textContent = point;
                strongPoints.appendChild(li);
            });
        } else {
            strongPoints.innerHTML = '<li>Geen sterke punten geïdentificeerd</li>';
        }
        
        // Update improvement points
        const improvementPoints = document.getElementById('improvement-points');
        improvementPoints.innerHTML = '';
        if (data.verbeterpunten && data.verbeterpunten.length > 0) {
            data.verbeterpunten.forEach(point => {
                const li = document.createElement('li');
                li.textContent = point;
                improvementPoints.appendChild(li);
            });
        } else {
            improvementPoints.innerHTML = '<li>Geen verbeterpunten geïdentificeerd</li>';
        }
        
        // Scroll to results
        this.results.scrollIntoView({ behavior: 'smooth' });
    }

    resetForm() {
        this.results.style.display = 'none';
        this.form.style.display = 'block';
        this.hideMessages();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setLoading(loading) {
        this.scanButton.disabled = loading;
        
        if (loading) {
            this.buttonText.textContent = 'Analyseren...';
            this.spinner.style.display = 'block';
        } else {
            this.buttonText.textContent = 'Analyseer Match';
            this.spinner.style.display = 'none';
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
    }

    showPaymentPrompt() {
        this.paymentPrompt.style.display = 'block';
    }

    hideMessages() {
        this.errorMessage.style.display = 'none';
        this.paymentPrompt.style.display = 'none';
    }

    showMessage(message, type = 'info') {
        // Create temporary message element
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.cssText = `
            background: ${type === 'success' ? '#d4edda' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : '#0c5460'};
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#bee5eb'};
        `;
        
        // Insert at the top of container
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild.nextSibling);
        
        // Remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CVScanner();
});