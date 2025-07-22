// Funkcja do konwersji parametrów dla PostgreSQL
function convertParams(params) {
  return params.map(param => {
    // Konwersja wartości liczbowych zapisanych jako stringi
    if (typeof param === 'string' && !isNaN(Number(param))) {
      return Number(param);
    }
    
    // Konwersja wartości boolean
    if (param === 1 && typeof param === 'number') return true;
    if (param === 0 && typeof param === 'number') return false;
    if (param === 'true') return true;
    if (param === 'false') return false;
    
    return param;
  });
}

module.exports = convertParams;