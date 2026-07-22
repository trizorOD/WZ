const axios = require('axios');
const config = require('../config');

async function lookupNip(nip) {
  const today = new Date().toISOString().slice(0, 10);
  const url = `${config.mfNip.baseUrl}/api/search/nip/${nip}`;
  const response = await axios.get(url, { params: { date: today } });
  const subject = response.data?.result?.subject;
  if (!subject) return null;
  return {
    nip: subject.nip,
    name: subject.name,
    address: subject.workingAddress || subject.residenceAddress || '',
    regon: subject.regon || null,
    vatStatus: subject.statusVat || null,
  };
}

module.exports = { lookupNip };
