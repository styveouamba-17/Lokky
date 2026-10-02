// Fuseau volontairement éloigné de Dakar (UTC+14) : prouve que l'app affiche
// l'heure de Dakar quel que soit le réglage du téléphone.
module.exports = () => {
  process.env.TZ = 'Pacific/Kiritimati';
};
