export type Locale = 'en' | 'ro'

export const translations = {
  en: {
    // Common
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      logout: 'Logout',
      settings: 'Settings',
      dashboard: 'Dashboard',
      analytics: 'Analytics',
      admin: 'Admin',
      export: 'Export',
      refresh: 'Refresh'
    },

    // Dashboard
    dashboard: {
      greeting: 'Good morning!',
      subtitle: 'Your AI analyst has been monitoring your campaign. Here\'s what\'s important today.',
      keyMetrics: 'Key Metrics',
      campaignStatus: 'Campaign Status',
      active: 'Active',
      inactive: 'Inactive',
      cashbackRate: 'Cashback Rate',
      highestInMarket: 'Highest in market',
      campaignRoi: 'Campaign ROI',
      healthyRange: 'Healthy range',
      participationRate: 'Participation Rate',
      ofTotalCustomers: 'of total customers',
      customizeDashboard: 'Customize Dashboard',
      showHideWidgets: 'Show, hide, and reorder your dashboard widgets',
      visibleWidgets: 'Visible Widgets',
      hiddenWidgets: 'Hidden Widgets',
      resetToDefault: 'Reset to default'
    },

    // Metrics
    metrics: {
      transactions: 'Transactions',
      revenue: 'Revenue',
      customers: 'Customers',
      cashbackPaid: 'Cashback Paid',
      avgTransaction: 'Avg. Transaction',
      totalRevenue: 'Total Revenue',
      totalTransactions: 'Total Transactions',
      totalCustomers: 'Total Customers'
    },

    // Competition
    competition: {
      title: 'Competitor Comparison',
      rank: 'Rank',
      merchant: 'Merchant',
      status: 'Status',
      thatsYou: 'That\'s you!'
    },

    // AI Features
    ai: {
      executiveBriefing: 'Executive Briefing',
      insights: 'Insights',
      anomalyAlerts: 'Anomaly Alerts',
      recommendations: 'AI Recommendations',
      noRecommendations: 'All metrics look healthy!',
      analyzingData: 'Analyzing your data...',
      expectedImpact: 'Expected Impact',
      recommendedAction: 'Recommended Action'
    },

    // Date Range
    dateRange: {
      last7Days: 'Last 7 days',
      last14Days: 'Last 14 days',
      last30Days: 'Last 30 days',
      last60Days: 'Last 60 days',
      last90Days: 'Last 90 days',
      customRange: 'Custom Range',
      quickSelect: 'Quick Select',
      startDate: 'Start Date',
      endDate: 'End Date',
      applyRange: 'Apply Range',
      selected: 'Selected'
    },

    // Export
    export: {
      exportData: 'Export Data',
      csv: 'CSV',
      csvDescription: 'Comma-separated values',
      excel: 'Excel',
      excelDescription: 'Microsoft Excel format',
      json: 'JSON',
      jsonDescription: 'For developers & integrations'
    },

    // Settings
    settings: {
      title: 'Settings',
      subtitle: 'Manage your merchant configuration',
      apiAccess: 'API Access',
      apiAccessDescription: 'Use your API key to access metrics, anomalies, and forecasts programmatically.',
      webhooks: 'Webhooks',
      webhooksDescription: 'Receive real-time notifications when important events occur.',
      branding: 'Branding',
      brandingDescription: 'Customize the look and feel of your analytics dashboard.',
      scheduledReports: 'Scheduled Reports',
      scheduledReportsDescription: 'Automatically receive analytics reports via email.',
      notifications: 'Notification Settings',
      notificationsDescription: 'Configure how you want to be notified about anomalies and alerts.',
      language: 'Language',
      languageDescription: 'Choose your preferred language.'
    },

    // Cohort Analysis
    cohort: {
      title: 'Customer Cohort Analysis',
      subtitle: 'Track customer retention over time by acquisition cohort',
      totalCustomers: 'Total Customers',
      avgFirstMonthRetention: 'Avg. 1st Month Retention',
      avgThirdMonthRetention: 'Avg. 3rd Month Retention',
      cohort: 'Cohort',
      size: 'Size',
      retention: 'Retention'
    },

    // Notifications
    notifications: {
      emailNotifications: 'Email Notifications',
      anomalyAlerts: 'Anomaly Alerts',
      anomalyAlertsDescription: 'Get notified when unusual patterns are detected',
      weeklyDigest: 'Weekly Digest',
      weeklyDigestDescription: 'Receive a weekly summary of your metrics',
      thresholdAlerts: 'Threshold Alerts',
      thresholdAlertsDescription: 'Alert when metrics fall below thresholds',
      slackNotifications: 'Slack Notifications',
      webhookUrl: 'Webhook URL',
      testNotification: 'Send test',
      alertThresholds: 'Alert Thresholds',
      minDailyRevenue: 'Minimum Daily Revenue (RON)',
      minDailyTransactions: 'Minimum Daily Transactions'
    }
  },

  ro: {
    // Common
    common: {
      save: 'Salvează',
      cancel: 'Anulează',
      delete: 'Șterge',
      edit: 'Editează',
      loading: 'Se încarcă...',
      error: 'Eroare',
      success: 'Succes',
      logout: 'Deconectare',
      settings: 'Setări',
      dashboard: 'Panou',
      analytics: 'Analiză',
      admin: 'Admin',
      export: 'Export',
      refresh: 'Reîmprospătează'
    },

    // Dashboard
    dashboard: {
      greeting: 'Bună dimineața!',
      subtitle: 'Analistul tău AI a monitorizat campania ta. Iată ce e important azi.',
      keyMetrics: 'Indicatori Cheie',
      campaignStatus: 'Status Campanie',
      active: 'Activă',
      inactive: 'Inactivă',
      cashbackRate: 'Rata Cashback',
      highestInMarket: 'Cea mai mare din piață',
      campaignRoi: 'ROI Campanie',
      healthyRange: 'Interval sănătos',
      participationRate: 'Rata de Participare',
      ofTotalCustomers: 'din totalul clienților',
      customizeDashboard: 'Personalizare Panou',
      showHideWidgets: 'Afișează, ascunde și reordonează widget-urile',
      visibleWidgets: 'Widget-uri Vizibile',
      hiddenWidgets: 'Widget-uri Ascunse',
      resetToDefault: 'Resetează la implicit'
    },

    // Metrics
    metrics: {
      transactions: 'Tranzacții',
      revenue: 'Venituri',
      customers: 'Clienți',
      cashbackPaid: 'Cashback Plătit',
      avgTransaction: 'Tranzacție Medie',
      totalRevenue: 'Venituri Totale',
      totalTransactions: 'Tranzacții Totale',
      totalCustomers: 'Clienți Totali'
    },

    // Competition
    competition: {
      title: 'Comparație cu Competitorii',
      rank: 'Loc',
      merchant: 'Comerciant',
      status: 'Status',
      thatsYou: 'Aceasta ești tu!'
    },

    // AI Features
    ai: {
      executiveBriefing: 'Rezumat Executiv',
      insights: 'Analize',
      anomalyAlerts: 'Alerte Anomalii',
      recommendations: 'Recomandări AI',
      noRecommendations: 'Toți indicatorii arată bine!',
      analyzingData: 'Se analizează datele...',
      expectedImpact: 'Impact Estimat',
      recommendedAction: 'Acțiune Recomandată'
    },

    // Date Range
    dateRange: {
      last7Days: 'Ultimele 7 zile',
      last14Days: 'Ultimele 14 zile',
      last30Days: 'Ultimele 30 zile',
      last60Days: 'Ultimele 60 zile',
      last90Days: 'Ultimele 90 zile',
      customRange: 'Interval Personalizat',
      quickSelect: 'Selecție Rapidă',
      startDate: 'Data Start',
      endDate: 'Data Sfârșit',
      applyRange: 'Aplică Interval',
      selected: 'Selectat'
    },

    // Export
    export: {
      exportData: 'Export Date',
      csv: 'CSV',
      csvDescription: 'Valori separate prin virgulă',
      excel: 'Excel',
      excelDescription: 'Format Microsoft Excel',
      json: 'JSON',
      jsonDescription: 'Pentru dezvoltatori și integrări'
    },

    // Settings
    settings: {
      title: 'Setări',
      subtitle: 'Gestionează configurația comerciantului',
      apiAccess: 'Acces API',
      apiAccessDescription: 'Folosește cheia API pentru a accesa indicatori, anomalii și previziuni programatic.',
      webhooks: 'Webhooks',
      webhooksDescription: 'Primește notificări în timp real când au loc evenimente importante.',
      branding: 'Branding',
      brandingDescription: 'Personalizează aspectul panoului de analiză.',
      scheduledReports: 'Rapoarte Programate',
      scheduledReportsDescription: 'Primește automat rapoarte de analiză pe email.',
      notifications: 'Setări Notificări',
      notificationsDescription: 'Configurează cum vrei să fii notificat despre anomalii și alerte.',
      language: 'Limbă',
      languageDescription: 'Alege limba preferată.'
    },

    // Cohort Analysis
    cohort: {
      title: 'Analiză Cohortă Clienți',
      subtitle: 'Urmărește retenția clienților în timp pe baza cohortei de achiziție',
      totalCustomers: 'Total Clienți',
      avgFirstMonthRetention: 'Retenție Medie Luna 1',
      avgThirdMonthRetention: 'Retenție Medie Luna 3',
      cohort: 'Cohortă',
      size: 'Mărime',
      retention: 'Retenție'
    },

    // Notifications
    notifications: {
      emailNotifications: 'Notificări Email',
      anomalyAlerts: 'Alerte Anomalii',
      anomalyAlertsDescription: 'Fii notificat când sunt detectate tipare neobișnuite',
      weeklyDigest: 'Rezumat Săptămânal',
      weeklyDigestDescription: 'Primește un rezumat săptămânal al indicatorilor',
      thresholdAlerts: 'Alerte Prag',
      thresholdAlertsDescription: 'Alertă când indicatorii scad sub praguri',
      slackNotifications: 'Notificări Slack',
      webhookUrl: 'URL Webhook',
      testNotification: 'Trimite test',
      alertThresholds: 'Praguri Alertă',
      minDailyRevenue: 'Venit Minim Zilnic (RON)',
      minDailyTransactions: 'Tranzacții Minime Zilnice'
    }
  }
}

// Create a type that represents the structure but allows any string values
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : string
}

export type TranslationKeys = DeepStringify<typeof translations.en>
