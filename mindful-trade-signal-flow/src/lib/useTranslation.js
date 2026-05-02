import { useLanguage } from './LanguageContext';
import { displayChamber, displayIssuerName, displayParty, displaySector, t, translateHeaderTitle } from './i18n';

export function useTranslation() {
  const { language } = useLanguage();

  return {
    language,
    t: (key) => t(key, language),
    displaySector: (sectorName) => displaySector(sectorName, language),
    displayIssuerName: (issuerName, ticker) => displayIssuerName(issuerName, language, ticker),
    displayParty: (party) => displayParty(party, language),
    displayChamber: (chamber) => displayChamber(chamber, language),
    translateHeaderTitle: (title) => translateHeaderTitle(title, language),
  };
}

