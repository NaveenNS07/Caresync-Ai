export type SupportedLanguage = 'en' | 'ta' | 'hi';

export interface Translations {
  appName: string;
  tagline: string;
  loopStageDetect: string;
  loopStageExplain: string;
  loopStagePrioritize: string;
  loopStageCoordinate: string;
  loopStageFollowThrough: string;
  
  severityCritical: string;
  severityWarning: string;
  severityStable: string;
  severityInfo: string;

  navDashboard: string;
  navPatients: string;
  navEscalations: string;
  navReferrals: string;
  navTasks: string;
  navManager: string;
  navAudit: string;
  navRules: string;
  navSettings: string;

  btnRunHero: string;
  btnAddReading: string;
  btnAddPatient: string;
  btnRequestReview: string;
  btnCreateReferral: string;
  btnSyncNow: string;
  btnAcknowledge: string;
  btnSaveOffline: string;
  btnSendSmsFallback: string;
  btnCloseLoop: string;

  statusOnline: string;
  statusOffline: string;
  simulateOffline: string;
  lastSynced: string;
  itemsWaiting: string;
  
  disclaimerText: string;
}

export const translations: Record<SupportedLanguage, Translations> = {
  en: {
    appName: 'CARESYNC AI',
    tagline: 'From the first warning to the completed follow-up.',
    loopStageDetect: '1. Detect',
    loopStageExplain: '2. Explain',
    loopStagePrioritize: '3. Prioritize',
    loopStageCoordinate: '4. Coordinate',
    loopStageFollowThrough: '5. Follow Through',
    
    severityCritical: 'RED - Urgent',
    severityWarning: 'AMBER - Warning',
    severityStable: 'GREEN - Stable',
    severityInfo: 'BLUE - Info',

    navDashboard: 'Dashboard',
    navPatients: 'Patients',
    navEscalations: 'Senior Review',
    navReferrals: 'Referrals',
    navTasks: 'Follow-up Tasks',
    navManager: 'Manager KPIs',
    navAudit: 'Audit Trail',
    navRules: 'Rule Thresholds',
    navSettings: 'Settings',

    btnRunHero: 'Run Hero Scenario',
    btnAddReading: '+ Add Reading',
    btnAddPatient: '+ Add Patient',
    btnRequestReview: 'Request Senior Review',
    btnCreateReferral: 'Create Referral',
    btnSyncNow: 'Sync Now',
    btnAcknowledge: 'Acknowledge Alert',
    btnSaveOffline: 'Save on Device',
    btnSendSmsFallback: 'Send via SMS Fallback',
    btnCloseLoop: 'Document Outcome & Close Loop',

    statusOnline: 'Online',
    statusOffline: 'Offline',
    simulateOffline: 'Simulate Offline',
    lastSynced: 'Last synced',
    itemsWaiting: 'items waiting to send',
    
    disclaimerText: 'Prototype with simulated data. Thresholds must be validated by clinicians before any real use.'
  },
  ta: {
    appName: 'கேர்சின்க் ஏஐ (CareSync AI)',
    tagline: 'முதல் எச்சரிக்கை முதல் நிறைவுற்ற சிகிச்சை வரை.',
    loopStageDetect: '1. கண்டறி',
    loopStageExplain: '2. விளக்கு',
    loopStagePrioritize: '3. முன்னுரிமை',
    loopStageCoordinate: '4. ஒருங்கிணை',
    loopStageFollowThrough: '5. பின்தொடர்',
    
    severityCritical: 'சிவப்பு - அவசரம்',
    severityWarning: 'மஞ்சள் - எச்சரிக்கை',
    severityStable: 'பச்சை - சீரானது',
    severityInfo: 'நீலம் - தகவல்',

    navDashboard: 'முகப்பு பலகை',
    navPatients: 'நோயாளிகள்',
    navEscalations: 'மூத்த மருத்துவர் மறுஆய்வு',
    navReferrals: 'பரிந்துரைகள்',
    navTasks: 'பின்தொடர் பணிகள்',
    navManager: 'மேலாளர் அளவீடுகள்',
    navAudit: 'தணிக்கை பதிவு',
    navRules: 'விதி வரம்புகள்',
    navSettings: 'அமைப்புகள்',

    btnRunHero: 'முக்கிய செயல்விளக்கம்',
    btnAddReading: '+ அளவீடு சேர்க்க',
    btnAddPatient: '+ நோயாளி சேர்க்க',
    btnRequestReview: 'மருத்துவர் ஆய்வைக் கோருக',
    btnCreateReferral: 'பரிந்துரை உருவாக்குக',
    btnSyncNow: 'இப்போதே ஒத்திசைக்கவும்',
    btnAcknowledge: 'எச்சரிக்கையை உறுதிசெய்',
    btnSaveOffline: 'சாதனத்தில் சேமி',
    btnSendSmsFallback: 'SMS வழியாக அனுப்புக',
    btnCloseLoop: 'முடிவை பதிவு செய்து நிறைவுசெய்',

    statusOnline: 'இணையத்தில்',
    statusOffline: 'ஆஃப்லைன்',
    simulateOffline: 'ஆஃப்லைனை பாவனை செய்',
    lastSynced: 'கடைசி ஒத்திசைவு',
    itemsWaiting: 'அனுப்ப காத்திருக்கும் பொருட்கள்',
    
    disclaimerText: 'போலி தரவுகளுடன் கூடிய முன்மாதிரி. உண்மையான பயன்பாட்டிற்கு முன் மருத்துவர்கள் சரிபார்க்க வேண்டும்.'
  },
  hi: {
    appName: 'केयरसिंक एआई (CareSync AI)',
    tagline: 'पहली चेतावनी से लेकर पूर्ण उपचार तक।',
    loopStageDetect: '1. पहचान',
    loopStageExplain: '2. व्याख्या',
    loopStagePrioritize: '3. प्राथमिकता',
    loopStageCoordinate: '4. समन्वय',
    loopStageFollowThrough: '5. अनुवर्ती कार्रवाई',
    
    severityCritical: 'लाल - अति गंभीर',
    severityWarning: 'पीला - चेतावनी',
    severityStable: 'हरा - स्थिर',
    severityInfo: 'नीला - सूचना',

    navDashboard: 'डैशबोर्ड',
    navPatients: 'मरीज सूची',
    navEscalations: 'वरिष्ठ समीक्षा',
    navReferrals: 'रेफरल समन्वय',
    navTasks: 'फॉलो-अप कार्य',
    navManager: 'प्रबंधक केपीआई',
    navAudit: 'ऑडिट ट्रेल',
    navRules: 'नियम सीमाएँ',
    navSettings: 'सेटिंग्स',

    btnRunHero: 'हीरो डेमो शुरू करें',
    btnAddReading: '+ रीडिंग दर्ज करें',
    btnAddPatient: '+ नया मरीज जोड़ें',
    btnRequestReview: 'डॉक्टर समीक्षा का अनुरोध',
    btnCreateReferral: 'रेफरल तैयार करें',
    btnSyncNow: 'अभी सिंक करें',
    btnAcknowledge: 'अलर्ट स्वीकार करें',
    btnSaveOffline: 'डिवाइस पर सहेजें',
    btnSendSmsFallback: 'SMS फॉलबैक भेजें',
    btnCloseLoop: 'परिणाम दर्ज कर लूप पूरा करें',

    statusOnline: 'ऑनलाइन',
    statusOffline: 'ऑफ़लाइन',
    simulateOffline: 'ऑफ़लाइन अनुकरण',
    lastSynced: 'अंतिम सिंक',
    itemsWaiting: 'आइटम भेजने हेतु शेष',
    
    disclaimerText: 'सिम्युलेटेड डेटा के साथ प्रोटोटाइप। वास्तविक उपयोग से पहले चिकित्सकों द्वारा सत्यापन आवश्यक है।'
  }
};
