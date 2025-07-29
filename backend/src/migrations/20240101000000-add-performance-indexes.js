'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Performance-kritische Indizes für bessere Abfrage-Performance
    
    // Benutzer-Indizes
    await queryInterface.addIndex('Users', ['email'], {
      name: 'idx_users_email',
      unique: true
    });
    
    await queryInterface.addIndex('Users', ['mandantId'], {
      name: 'idx_users_mandant_id'
    });
    
    await queryInterface.addIndex('Users', ['role'], {
      name: 'idx_users_role'
    });
    
    await queryInterface.addIndex('Users', ['aktiv'], {
      name: 'idx_users_aktiv'
    });

    // Anlagen-Indizes
    await queryInterface.addIndex('Anlagen', ['qrCode'], {
      name: 'idx_anlagen_qr_code',
      unique: true
    });
    
    await queryInterface.addIndex('Anlagen', ['mandantId'], {
      name: 'idx_anlagen_mandant_id'
    });
    
    await queryInterface.addIndex('Anlagen', ['objektId'], {
      name: 'idx_anlagen_objekt_id'
    });
    
    await queryInterface.addIndex('Anlagen', ['aksCode'], {
      name: 'idx_anlagen_aks_code'
    });
    
    await queryInterface.addIndex('Anlagen', ['status'], {
      name: 'idx_anlagen_status'
    });
    
    await queryInterface.addIndex('Anlagen', ['mandantId', 'status'], {
      name: 'idx_anlagen_mandant_status'
    });
    
    await queryInterface.addIndex('Anlagen', ['mandantId', 'aksCode'], {
      name: 'idx_anlagen_mandant_aks'
    });
    
    // Volltext-Index für Suche
    await queryInterface.addIndex('Anlagen', ['bezeichnung'], {
      name: 'idx_anlagen_bezeichnung'
    });

    // AKS-Code-Indizes
    await queryInterface.addIndex('AksCodes', ['code'], {
      name: 'idx_aks_codes_code',
      unique: true
    });
    
    await queryInterface.addIndex('AksCodes', ['mandantId'], {
      name: 'idx_aks_codes_mandant_id'
    });
    
    await queryInterface.addIndex('AksCodes', ['kategorie'], {
      name: 'idx_aks_codes_kategorie'
    });

    // Objekt-Indizes
    await queryInterface.addIndex('Objekte', ['mandantId'], {
      name: 'idx_objekte_mandant_id'
    });
    
    await queryInterface.addIndex('Objekte', ['liegenschaftId'], {
      name: 'idx_objekte_liegenschaft_id'
    });

    // Liegenschaft-Indizes
    await queryInterface.addIndex('Liegenschaften', ['mandantId'], {
      name: 'idx_liegenschaften_mandant_id'
    });

    // Import-Job-Indizes
    await queryInterface.addIndex('ImportJobs', ['mandantId'], {
      name: 'idx_import_jobs_mandant_id'
    });
    
    await queryInterface.addIndex('ImportJobs', ['status'], {
      name: 'idx_import_jobs_status'
    });
    
    await queryInterface.addIndex('ImportJobs', ['erstelltAm'], {
      name: 'idx_import_jobs_erstellt_am'
    });

    // Audit-Log-Indizes
    await queryInterface.addIndex('AuditLogs', ['mandantId'], {
      name: 'idx_audit_logs_mandant_id'
    });
    
    await queryInterface.addIndex('AuditLogs', ['userId'], {
      name: 'idx_audit_logs_user_id'
    });
    
    await queryInterface.addIndex('AuditLogs', ['entityType'], {
      name: 'idx_audit_logs_entity_type'
    });
    
    await queryInterface.addIndex('AuditLogs', ['action'], {
      name: 'idx_audit_logs_action'
    });
    
    await queryInterface.addIndex('AuditLogs', ['timestamp'], {
      name: 'idx_audit_logs_timestamp'
    });
    
    // Composite Index für häufige Abfragen
    await queryInterface.addIndex('AuditLogs', ['mandantId', 'timestamp'], {
      name: 'idx_audit_logs_mandant_timestamp'
    });

    // Session-Store-Indizes (falls Session-Tabelle verwendet wird)
    await queryInterface.addIndex('Sessions', ['sid'], {
      name: 'idx_sessions_sid',
      unique: true
    });
    
    await queryInterface.addIndex('Sessions', ['expire'], {
      name: 'idx_sessions_expire'
    });
  },

  async down(queryInterface, Sequelize) {
    // Indizes entfernen
    const indexes = [
      'idx_users_email',
      'idx_users_mandant_id',
      'idx_users_role',
      'idx_users_aktiv',
      'idx_anlagen_qr_code',
      'idx_anlagen_mandant_id',
      'idx_anlagen_objekt_id',
      'idx_anlagen_aks_code',
      'idx_anlagen_status',
      'idx_anlagen_mandant_status',
      'idx_anlagen_mandant_aks',
      'idx_anlagen_bezeichnung',
      'idx_aks_codes_code',
      'idx_aks_codes_mandant_id',
      'idx_aks_codes_kategorie',
      'idx_objekte_mandant_id',
      'idx_objekte_liegenschaft_id',
      'idx_liegenschaften_mandant_id',
      'idx_import_jobs_mandant_id',
      'idx_import_jobs_status',
      'idx_import_jobs_erstellt_am',
      'idx_audit_logs_mandant_id',
      'idx_audit_logs_user_id',
      'idx_audit_logs_entity_type',
      'idx_audit_logs_action',
      'idx_audit_logs_timestamp',
      'idx_audit_logs_mandant_timestamp',
      'idx_sessions_sid',
      'idx_sessions_expire'
    ];

    for (const indexName of indexes) {
      try {
        await queryInterface.removeIndex('Users', indexName);
      } catch (error) {
        // Index existiert möglicherweise nicht
      }
    }
  }
};