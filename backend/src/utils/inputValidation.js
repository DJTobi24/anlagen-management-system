const validator = require('validator');
const logger = require('./logger');

// Basis-Validierungs-Klasse
class InputValidator {
  constructor() {
    this.errors = [];
  }

  // Fehler zurücksetzen
  reset() {
    this.errors = [];
    return this;
  }

  // Fehler hinzufügen
  addError(field, message) {
    this.errors.push({ field, message });
    return this;
  }

  // Prüfen ob Validierung erfolgreich
  isValid() {
    return this.errors.length === 0;
  }

  // Alle Fehler abrufen
  getErrors() {
    return this.errors;
  }

  // Erstes Fehler-Object
  getFirstError() {
    return this.errors[0] || null;
  }

  // String-Validierung
  validateString(value, field, options = {}) {
    const {
      required = false,
      minLength = 0,
      maxLength = 255,
      pattern = null,
      whitelist = null,
      blacklist = null,
      trim = true
    } = options;

    // Trim wenn aktiviert
    if (trim && typeof value === 'string') {
      value = value.trim();
    }

    // Required Check
    if (required && (!value || value === '')) {
      this.addError(field, `${field} ist erforderlich`);
      return this;
    }

    // Wenn nicht required und leer, dann OK
    if (!required && (!value || value === '')) {
      return this;
    }

    // Type Check
    if (typeof value !== 'string') {
      this.addError(field, `${field} muss ein String sein`);
      return this;
    }

    // Length Checks
    if (value.length < minLength) {
      this.addError(field, `${field} muss mindestens ${minLength} Zeichen lang sein`);
    }

    if (value.length > maxLength) {
      this.addError(field, `${field} darf maximal ${maxLength} Zeichen lang sein`);
    }

    // Pattern Check
    if (pattern && !pattern.test(value)) {
      this.addError(field, `${field} hat ein ungültiges Format`);
    }

    // Whitelist Check
    if (whitelist && !whitelist.includes(value)) {
      this.addError(field, `${field} hat einen ungültigen Wert`);
    }

    // Blacklist Check
    if (blacklist && blacklist.includes(value)) {
      this.addError(field, `${field} enthält nicht erlaubte Werte`);
    }

    return this;
  }

  // Email-Validierung
  validateEmail(value, field, required = false) {
    if (required && !value) {
      this.addError(field, `${field} ist erforderlich`);
      return this;
    }

    if (value && !validator.isEmail(value)) {
      this.addError(field, `${field} muss eine gültige E-Mail-Adresse sein`);
    }

    return this;
  }

  // Passwort-Validierung
  validatePassword(value, field, options = {}) {
    const {
      required = true,
      minLength = 8,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecialChars = true,
      blacklist = ['password', '123456', 'admin']
    } = options;

    if (required && !value) {
      this.addError(field, `${field} ist erforderlich`);
      return this;
    }

    if (!value) return this;

    if (value.length < minLength) {
      this.addError(field, `${field} muss mindestens ${minLength} Zeichen lang sein`);
    }

    if (requireUppercase && !/[A-Z]/.test(value)) {
      this.addError(field, `${field} muss mindestens einen Großbuchstaben enthalten`);
    }

    if (requireLowercase && !/[a-z]/.test(value)) {
      this.addError(field, `${field} muss mindestens einen Kleinbuchstaben enthalten`);
    }

    if (requireNumbers && !/\d/.test(value)) {
      this.addError(field, `${field} muss mindestens eine Zahl enthalten`);
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      this.addError(field, `${field} muss mindestens ein Sonderzeichen enthalten`);
    }

    // Blacklist Check (case-insensitive)
    const lowerValue = value.toLowerCase();
    if (blacklist.some(banned => lowerValue.includes(banned.toLowerCase()))) {
      this.addError(field, `${field} enthält nicht erlaubte Begriffe`);
    }

    return this;
  }

  // Number-Validierung
  validateNumber(value, field, options = {}) {
    const {
      required = false,
      min = null,
      max = null,
      integer = false
    } = options;

    if (required && (value === null || value === undefined)) {
      this.addError(field, `${field} ist erforderlich`);
      return this;
    }

    if (value === null || value === undefined) return this;

    const numValue = Number(value);
    if (isNaN(numValue)) {
      this.addError(field, `${field} muss eine gültige Zahl sein`);
      return this;
    }

    if (integer && !Number.isInteger(numValue)) {
      this.addError(field, `${field} muss eine ganze Zahl sein`);
    }

    if (min !== null && numValue < min) {
      this.addError(field, `${field} muss mindestens ${min} sein`);
    }

    if (max !== null && numValue > max) {
      this.addError(field, `${field} darf maximal ${max} sein`);
    }

    return this;
  }

  // Boolean-Validierung
  validateBoolean(value, field, required = false) {
    if (required && value === undefined) {
      this.addError(field, `${field} ist erforderlich`);
      return this;
    }

    if (value !== undefined && typeof value !== 'boolean') {
      this.addError(field, `${field} muss ein Boolean-Wert sein`);
    }

    return this;
  }

  // Date-Validierung
  validateDate(value, field, options = {}) {
    const {
      required = false,
      minDate = null,
      maxDate = null,
      format = null
    } = options;

    if (required && !value) {
      this.addError(field, `${field} ist erforderlich`);
      return this;
    }

    if (!value) return this;

    let date;
    if (format) {
      if (!validator.isDate(value, { format })) {
        this.addError(field, `${field} muss im Format ${format} sein`);
        return this;
      }
      date = new Date(value);
    } else {
      date = new Date(value);
      if (isNaN(date.getTime())) {
        this.addError(field, `${field} muss ein gültiges Datum sein`);
        return this;
      }
    }

    if (minDate && date < new Date(minDate)) {
      this.addError(field, `${field} darf nicht vor ${minDate} liegen`);
    }

    if (maxDate && date > new Date(maxDate)) {
      this.addError(field, `${field} darf nicht nach ${maxDate} liegen`);
    }

    return this;
  }

  // Array-Validierung
  validateArray(value, field, options = {}) {
    const {
      required = false,
      minLength = 0,
      maxLength = null,
      uniqueItems = false,
      itemValidator = null
    } = options;

    if (required && (!value || !Array.isArray(value))) {
      this.addError(field, `${field} ist erforderlich und muss ein Array sein`);
      return this;
    }

    if (!value || !Array.isArray(value)) return this;

    if (value.length < minLength) {
      this.addError(field, `${field} muss mindestens ${minLength} Elemente enthalten`);
    }

    if (maxLength && value.length > maxLength) {
      this.addError(field, `${field} darf maximal ${maxLength} Elemente enthalten`);
    }

    if (uniqueItems) {
      const unique = [...new Set(value)];
      if (unique.length !== value.length) {
        this.addError(field, `${field} darf nur eindeutige Werte enthalten`);
      }
    }

    // Elemente validieren
    if (itemValidator && typeof itemValidator === 'function') {
      value.forEach((item, index) => {
        const itemErrors = itemValidator(item, `${field}[${index}]`);
        if (itemErrors && itemErrors.length > 0) {
          this.errors = this.errors.concat(itemErrors);
        }
      });
    }

    return this;
  }

  // URL-Validierung
  validateURL(value, field, options = {}) {
    const {
      required = false,
      protocols = ['http', 'https'],
      requireProtocol = true
    } = options;

    if (required && !value) {
      this.addError(field, `${field} ist erforderlich`);
      return this;
    }

    if (value && !validator.isURL(value, { protocols, require_protocol: requireProtocol })) {
      this.addError(field, `${field} muss eine gültige URL sein`);
    }

    return this;
  }

  // UUID-Validierung
  validateUUID(value, field, required = false) {
    if (required && !value) {
      this.addError(field, `${field} ist erforderlich`);
      return this;
    }

    if (value && !validator.isUUID(value)) {
      this.addError(field, `${field} muss eine gültige UUID sein`);
    }

    return this;
  }

  // JSON-Validierung
  validateJSON(value, field, required = false) {
    if (required && !value) {
      this.addError(field, `${field} ist erforderlich`);
      return this;
    }

    if (value) {
      try {
        if (typeof value === 'string') {
          JSON.parse(value);
        } else if (typeof value !== 'object') {
          this.addError(field, `${field} muss ein gültiges JSON-Object sein`);
        }
      } catch (error) {
        this.addError(field, `${field} enthält ungültiges JSON`);
      }
    }

    return this;
  }

  // XSS-Schutz
  sanitizeHTML(value, field) {
    if (typeof value !== 'string') return this;

    const clean = validator.escape(value);
    if (clean !== value) {
      logger.warn(`HTML entities escaped in field: ${field}`);
    }

    return this;
  }

  // SQL-Injection-Schutz
  checkSQLInjection(value, field) {
    if (typeof value !== 'string') return this;

    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /('|(\\)|(;)|(\-\-)|(\#))/g
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(value)) {
        this.addError(field, `${field} enthält potentiell gefährliche Zeichen`);
        logger.warn(`Potential SQL injection in field: ${field}, value: ${value}`);
        break;
      }
    }

    return this;
  }

  // File-Upload-Validierung
  validateFile(file, field, options = {}) {
    const {
      required = false,
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf']
    } = options;

    if (required && !file) {
      this.addError(field, `${field} ist erforderlich`);
      return this;
    }

    if (!file) return this;

    // Dateigröße prüfen
    if (file.size > maxSize) {
      this.addError(field, `${field} ist zu groß (max. ${Math.round(maxSize / (1024 * 1024))}MB)`);
    }

    // MIME-Type prüfen
    if (!allowedTypes.includes(file.mimetype)) {
      this.addError(field, `${field} hat einen nicht erlaubten Dateityp`);
    }

    // Dateiendung prüfen
    const ext = require('path').extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      this.addError(field, `${field} hat eine nicht erlaubte Dateiendung`);
    }

    return this;
  }
}

// Factory-Funktion für neue Validator-Instanz
const createValidator = () => new InputValidator();

// Vordefinierte Validatoren
const validators = {
  // Benutzer-Validierung
  user: (data) => {
    return createValidator()
      .validateEmail(data.email, 'email', true)
      .validateString(data.firstName, 'firstName', { required: true, minLength: 2, maxLength: 50 })
      .validateString(data.lastName, 'lastName', { required: true, minLength: 2, maxLength: 50 })
      .validateString(data.role, 'role', { 
        required: true, 
        whitelist: ['admin', 'techniker', 'aufnehmer'] 
      })
      .validatePassword(data.password, 'password', { required: true });
  },

  // Anlagen-Validierung
  anlage: (data) => {
    return createValidator()
      .validateString(data.bezeichnung, 'bezeichnung', { required: true, minLength: 2, maxLength: 100 })
      .validateString(data.aksCode, 'aksCode', { required: true, pattern: /^[A-Z0-9-]{3,10}$/ })
      .validateString(data.status, 'status', {
        required: true,
        whitelist: ['aktiv', 'inaktiv', 'wartung', 'defekt']
      })
      .validateNumber(data.baujahr, 'baujahr', { min: 1900, max: new Date().getFullYear() + 5 })
      .validateString(data.hersteller, 'hersteller', { maxLength: 50 })
      .validateUUID(data.objektId, 'objektId', true);
  },

  // Login-Validierung
  login: (data) => {
    return createValidator()
      .validateEmail(data.email, 'email', true)
      .validateString(data.password, 'password', { required: true, minLength: 1 });
  },

  // AKS-Code-Validierung
  aksCode: (data) => {
    return createValidator()
      .validateString(data.code, 'code', { 
        required: true, 
        pattern: /^[A-Z0-9-]{3,10}$/,
        minLength: 3,
        maxLength: 10 
      })
      .validateString(data.bezeichnung, 'bezeichnung', { required: true, maxLength: 100 })
      .validateString(data.kategorie, 'kategorie', { required: true, maxLength: 50 })
      .validateArray(data.pflichtfelder, 'pflichtfelder', { uniqueItems: true })
      .validateJSON(data.validierungsregeln, 'validierungsregeln');
  }
};

module.exports = {
  InputValidator,
  createValidator,
  validators
};