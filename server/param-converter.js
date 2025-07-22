// Funkcja do konwersji parametrów dla PostgreSQL
function convertParams(params) {
  return params.map(param => {
    // Obsługa wartości null/undefined
    if (param === null || param === undefined) {
      return null;
    }
    
    // Konwersja wartości boolean
    if (param === true || param === 'true' || param === 1) {
      return true;
    }
    if (param === false || param === 'false' || param === 0) {
      return false;
    }
    
    // Konwersja wartości liczbowych zapisanych jako stringi
    if (typeof param === 'string' && !isNaN(Number(param))) {
      return Number(param);
    }
    
    // Dla wartości decimal/numeric upewnij się, że są liczbami
    if (param === 'NaN' || param === NaN) {
      return 0;
    }
    
    return param;
  });
}

module.exports = convertParams;