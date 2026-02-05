// Location constants for North Macedonia

export const NORTH_MACEDONIA_CITIES = [
  { value: 'skopje', label: 'Скопје (Skopje)' },
  { value: 'bitola', label: 'Битола (Bitola)' },
  { value: 'kumanovo', label: 'Куманово (Kumanovo)' },
  { value: 'prilep', label: 'Прилеп (Prilep)' },
  { value: 'tetovo', label: 'Тетово (Tetovo)' },
  { value: 'veles', label: 'Велес (Veles)' },
  { value: 'ohrid', label: 'Охрид (Ohrid)' },
  { value: 'gostivar', label: 'Гостивар (Gostivar)' },
  { value: 'strumica', label: 'Струмица (Strumica)' },
  { value: 'stip', label: 'Штип (Štip)' },
  { value: 'kocani', label: 'Кочани (Kočani)' },
  { value: 'kavadarci', label: 'Кavaдарци (Kavadarci)' },
  { value: 'struga', label: 'Струга (Struga)' },
  { value: 'gevgelija', label: 'Гевгелија (Gevgelija)' },
  { value: 'negotino', label: 'Неготино (Negotino)' },
  { value: 'debar', label: 'Дебар (Debar)' },
  { value: 'kicevo', label: 'Кичево (Kičevo)' },
  { value: 'delcevo', label: 'Делчево (Delčevo)' },
  { value: 'vinica', label: 'Виница (Vinica)' },
  { value: 'radovis', label: 'Радовиш (Radoviš)' },
  { value: 'probistip', label: 'Пробиштип (Probištip)' },
  { value: 'sveti_nikole', label: 'Свети Николе (Sveti Nikole)' },
  { value: 'berovo', label: 'Берово (Berovo)' },
  { value: 'kratovo', label: 'Кратово (Kratovo)' },
  { value: 'kriva_palanka', label: 'Крива Паланка (Kriva Palanka)' },
  { value: 'makedonska_kamenica', label: 'Македонска Каменица (Makedonska Kamenica)' },
  { value: 'resen', label: 'Ресен (Resen)' },
  { value: 'valandovo', label: 'Валандово (Valandovo)' },
  { value: 'makedonski_brod', label: 'Македонски Брод (Makedonski Brod)' },
  { value: 'dojran', label: 'Дојран (Dojran)' }
];

export const COUNTRIES = [
  { value: 'north_macedonia', label: 'Северна Македонија (North Macedonia)' }
];

// Helper function to get city label by value
export const getCityLabel = (cityValue) => {
  const city = NORTH_MACEDONIA_CITIES.find(c => c.value === cityValue);
  return city ? city.label : cityValue;
};

// Helper function to get country label by value
export const getCountryLabel = (countryValue) => {
  const country = COUNTRIES.find(c => c.value === countryValue);
  return country ? country.label : countryValue;
};

// Helper function to get English city name for display
export const getCityDisplayName = (cityValue) => {
  const city = NORTH_MACEDONIA_CITIES.find(c => c.value === cityValue);
  if (!city) return cityValue;

  // Extract English name from format "Скопје (Skopje)"
  const match = city.label.match(/\(([^)]+)\)/);
  return match ? match[1] : city.label;
};
