// Nigerian Naira Amount to Words Converter
// Converts numerical amounts to written format for invoices and receipts

class NairaAmountConverter {
    constructor() {
        this.ones = [
            '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
            'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
            'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
        ];
        
        this.tens = [
            '', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'
        ];
        
        this.scales = [
            '', 'THOUSAND', 'MILLION', 'BILLION', 'TRILLION'
        ];
    }
    
    // Convert a number (0-999) to words
    convertHundreds(num) {
        let result = '';
        
        if (num >= 100) {
            result += this.ones[Math.floor(num / 100)] + ' HUNDRED';
            num %= 100;
            if (num > 0) result += ' ';
        }
        
        if (num >= 20) {
            result += this.tens[Math.floor(num / 10)];
            num %= 10;
            if (num > 0) result += ' ' + this.ones[num];
        } else if (num > 0) {
            result += this.ones[num];
        }
        
        return result;
    }
    
    // Convert the main amount (before decimal) to words
    convertToWords(amount) {
        if (amount === 0) return 'ZERO';
        
        let result = '';
        let scaleIndex = 0;
        
        while (amount > 0) {
            let chunk = amount % 1000;
            if (chunk !== 0) {
                let chunkWords = this.convertHundreds(chunk);
                if (scaleIndex > 0) {
                    chunkWords += ' ' + this.scales[scaleIndex];
                }
                result = chunkWords + (result ? ' ' + result : '');
            }
            amount = Math.floor(amount / 1000);
            scaleIndex++;
        }
        
        return result;
    }
    
    // Convert kobo (cents) to words
    convertKobo(kobo) {
        if (kobo === 0) return '';
        return this.convertHundreds(kobo) + ' KOBO';
    }
    
    // Main function to convert amount to full Naira words
    convertAmountToWords(amount) {
        try {
            // Handle string input and clean it
            if (typeof amount === 'string') {
                amount = parseFloat(amount.replace(/[^0-9.-]/g, ''));
            }
            
            if (isNaN(amount) || amount < 0) {
                return 'INVALID AMOUNT';
            }
            
            // Round to 2 decimal places
            amount = Math.round(amount * 100) / 100;
            
            // Separate naira and kobo
            const naira = Math.floor(amount);
            const kobo = Math.round((amount - naira) * 100);
            
            let result = '';
            
            // Convert naira part
            if (naira > 0) {
                result = this.convertToWords(naira) + ' NAIRA';
            }
            
            // Convert kobo part
            if (kobo > 0) {
                if (naira > 0) {
                    result += ', ' + this.convertKobo(kobo);
                } else {
                    result = this.convertKobo(kobo);
                }
            } else if (naira > 0) {
                // Add "ONLY" for whole naira amounts
                result += ' ONLY';
            }
            
            // If no naira and no kobo
            if (naira === 0 && kobo === 0) {
                result = 'ZERO NAIRA ONLY';
            } else {
                result += ' ONLY';
            }
            
            return result;
        } catch (error) {
            console.error('Error converting amount to words:', error);
            return 'INVALID AMOUNT';
        }
    }
    
    // Format the amount with currency symbol
    formatAmountInWords(amount) {
        const words = this.convertAmountToWords(amount);
        const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);
        const formatted = new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2
        }).format(numericAmount);
        
        return `${formatted} = ${words}`;
    }
}

// Create global instance
const nairaConverter = new NairaAmountConverter();

// Export for use in other parts of the application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NairaAmountConverter, nairaConverter };
}