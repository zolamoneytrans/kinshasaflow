/**
 * @fileOverview Constantes globales pour l'application Kinshasa Flow.
 * Contient le référentiel des 100 axes routiers majeurs de Kinshasa.
 */

export const MAJOR_AXES = [
  // --- GOMBE (Centre-ville) ---
  { name: "Blvd 30 Juin (Gare Centrale)", district: "Gombe", origin: { lat: -4.3042, lng: 15.3150 }, destination: { lat: -4.3075, lng: 15.3085 }, capacity: 12000 },
  { name: "Blvd 30 Juin (Batetela)", district: "Gombe", origin: { lat: -4.3085, lng: 15.3060 }, destination: { lat: -4.3120, lng: 15.2980 }, capacity: 12000 },
  { name: "Blvd 30 Juin (Rond-point Mandela)", district: "Gombe", origin: { lat: -4.3120, lng: 15.2980 }, destination: { lat: -4.3160, lng: 15.2890 }, capacity: 12000 },
  { name: "Av. de la Justice (Cercle)", district: "Gombe", origin: { lat: -4.3030, lng: 15.2940 }, destination: { lat: -4.3070, lng: 15.3020 }, capacity: 6000 },
  { name: "Av. Colonel Ebeya", district: "Gombe", origin: { lat: -4.3060, lng: 15.3120 }, destination: { lat: -4.3120, lng: 15.3080 }, capacity: 5000 },
  { name: "Av. du Port", district: "Gombe", origin: { lat: -4.3010, lng: 15.3100 }, destination: { lat: -4.3050, lng: 15.3150 }, capacity: 7000 },
  { name: "Av. des Aviateurs", district: "Gombe", origin: { lat: -4.3050, lng: 15.3130 }, destination: { lat: -4.3100, lng: 15.3180 }, capacity: 4500 },
  { name: "Av. Batetela", district: "Gombe", origin: { lat: -4.3085, lng: 15.3060 }, destination: { lat: -4.3030, lng: 15.3010 }, capacity: 4000 },
  { name: "Av. de la Science", district: "Gombe", origin: { lat: -4.3140, lng: 15.3020 }, destination: { lat: -4.3180, lng: 15.3060 }, capacity: 5500 },
  { name: "Av. Haut-Congo", district: "Gombe", origin: { lat: -4.3065, lng: 15.3140 }, destination: { lat: -4.3100, lng: 15.3100 }, capacity: 3500 },

  // --- NGALIEMA (Ouest) ---
  { name: "Av. Mondjiba (Kintambo Magasin)", district: "Ngaliema", origin: { lat: -4.3270, lng: 15.2740 }, destination: { lat: -4.3200, lng: 15.2850 }, capacity: 9000 },
  { name: "Av. Nguma (Météo)", district: "Ngaliema", origin: { lat: -4.3280, lng: 15.2750 }, destination: { lat: -4.3400, lng: 15.2680 }, capacity: 7500 },
  { name: "Av. Nguma (Joli Parc)", district: "Ngaliema", origin: { lat: -4.3400, lng: 15.2680 }, destination: { lat: -4.3550, lng: 15.2620 }, capacity: 7000 },
  { name: "Route de Matadi (Binza)", district: "Ngaliema", origin: { lat: -4.3550, lng: 15.2620 }, destination: { lat: -4.3800, lng: 15.2580 }, capacity: 8500 },
  { name: "Route de Matadi (UPN)", district: "Ngaliema", origin: { lat: -4.3800, lng: 15.2580 }, destination: { lat: -4.4100, lng: 15.2500 }, capacity: 9500 },
  { name: "Av. du Tourisme (Berges fleuve)", district: "Ngaliema", origin: { lat: -4.3310, lng: 15.2420 }, destination: { lat: -4.3250, lng: 15.2650 }, capacity: 4500 },
  { name: "Av. des Écuries", district: "Ngaliema", origin: { lat: -4.3350, lng: 15.2700 }, destination: { lat: -4.3500, lng: 15.2750 }, capacity: 5000 },
  { name: "Av. de la Montagne", district: "Ngaliema", origin: { lat: -4.3450, lng: 15.2650 }, destination: { lat: -4.3300, lng: 15.2600 }, capacity: 3500 },
  { name: "Av. Maluku", district: "Ngaliema", origin: { lat: -4.3600, lng: 15.2550 }, destination: { lat: -4.3750, lng: 15.2500 }, capacity: 3000 },
  { name: "Av. de l'École", district: "Ngaliema", origin: { lat: -4.3250, lng: 15.2780 }, destination: { lat: -4.3150, lng: 15.2850 }, capacity: 4000 },

  // --- LIMETE / MASINA (Est - Axe Industriel et Aéroport) ---
  { name: "Échangeur de Limete (Nœud)", district: "Limete", origin: { lat: -4.3570, lng: 15.3580 }, destination: { lat: -4.3650, lng: 15.3750 }, capacity: 15000 },
  { name: "Blvd Lumumba (Limete 7e Rue)", district: "Limete", origin: { lat: -4.3400, lng: 15.3350 }, destination: { lat: -4.3550, lng: 15.3550 }, capacity: 14000 },
  { name: "Blvd Lumumba (Poids Lourds Junction)", district: "Limete", origin: { lat: -4.3250, lng: 15.3250 }, destination: { lat: -4.3400, lng: 15.3350 }, capacity: 13000 },
  { name: "Av. des Poids Lourds (Kingabwa)", district: "Limete", origin: { lat: -4.3150, lng: 15.3400 }, destination: { lat: -4.3350, lng: 15.3550 }, capacity: 9000 },
  { name: "Blvd Lumumba (Masina Pascal)", district: "Masina", origin: { lat: -4.3850, lng: 15.4200 }, destination: { lat: -4.4050, lng: 15.4500 }, capacity: 15000 },
  { name: "Blvd Lumumba (Aéroport N'djili)", district: "N'djili", origin: { lat: -4.4100, lng: 15.4600 }, destination: { lat: -4.4400, lng: 15.5200 }, capacity: 16000 },
  { name: "Av. de l'Université (Limete)", district: "Limete", origin: { lat: -4.3500, lng: 15.3300 }, destination: { lat: -4.3750, lng: 15.3280 }, capacity: 7000 },
  { name: "Petit Blvd de Limete", district: "Limete", origin: { lat: -4.3450, lng: 15.3300 }, destination: { lat: -4.3600, lng: 15.3500 }, capacity: 5000 },
  { name: "Av. Kingabwa", district: "Limete", origin: { lat: -4.3200, lng: 15.3350 }, destination: { lat: -4.3100, lng: 15.3450 }, capacity: 4000 },
  { name: "Av. Ndjoku", district: "Masina", origin: { lat: -4.3750, lng: 15.4100 }, destination: { lat: -4.3900, lng: 15.4300 }, capacity: 5500 },

  // --- KALAMU / KASA-VUBU (Cœur de ville) ---
  { name: "Av. Kasa-Vubu (Victoire)", district: "Kalamu", origin: { lat: -4.3430, lng: 15.3120 }, destination: { lat: -4.3350, lng: 15.3080 }, capacity: 8500 },
  { name: "Av. Victoire (Kalamu)", district: "Kalamu", origin: { lat: -4.3420, lng: 15.3150 }, destination: { lat: -4.3520, lng: 15.3250 }, capacity: 7500 },
  { name: "Av. de l'Université (Pont Gabu)", district: "Kalamu", origin: { lat: -4.3550, lng: 15.3180 }, destination: { lat: -4.3700, lng: 15.3220 }, capacity: 8000 },
  { name: "Blvd Triomphal (Stade des Martyrs)", district: "Kasa-Vubu", origin: { lat: -4.3380, lng: 15.3020 }, destination: { lat: -4.3320, lng: 15.3120 }, capacity: 11000 },
  { name: "Av. de l'Enseignement", district: "Kasa-Vubu", origin: { lat: -4.3400, lng: 15.3050 }, destination: { lat: -4.3480, lng: 15.3150 }, capacity: 6000 },
  { name: "Av. Kapela", district: "Kalamu", origin: { lat: -4.3500, lng: 15.3100 }, destination: { lat: -4.3650, lng: 15.3150 }, capacity: 4500 },
  { name: "Av. Kimwenza", district: "Kalamu", origin: { lat: -4.3520, lng: 15.3200 }, destination: { lat: -4.3600, lng: 15.3350 }, capacity: 5000 },
  { name: "Av. Shaba", district: "Kasa-Vubu", origin: { lat: -4.3450, lng: 15.2950 }, destination: { lat: -4.3550, lng: 15.3050 }, capacity: 4000 },
  { name: "Av. Éthiopie", district: "Kasa-Vubu", origin: { lat: -4.3420, lng: 15.3000 }, destination: { lat: -4.3500, lng: 15.3080 }, capacity: 4000 },
  { name: "Av. Gambela", district: "Kasa-Vubu", origin: { lat: -4.3450, lng: 15.3080 }, destination: { lat: -4.3350, lng: 15.3020 }, capacity: 5500 },

  // --- LINGWALA / BARUMBU / KINSHASA (Zone Nord) ---
  { name: "Av. Libération (24/11 - Lingwala)", district: "Lingwala", origin: { lat: -4.3350, lng: 15.3020 }, destination: { lat: -4.3180, lng: 15.2950 }, capacity: 8000 },
  { name: "Av. des Huileries (Lingwala)", district: "Lingwala", origin: { lat: -4.3250, lng: 15.3100 }, destination: { lat: -4.3150, lng: 15.3050 }, capacity: 7500 },
  { name: "Av. Flambeau", district: "Barumbu", origin: { lat: -4.3100, lng: 15.3200 }, destination: { lat: -4.3200, lng: 15.3300 }, capacity: 6000 },
  { name: "Av. Luambo Makiadi (Bokassa)", district: "Barumbu", origin: { lat: -4.3150, lng: 15.3150 }, destination: { lat: -4.3350, lng: 15.3100 }, capacity: 7000 },
  { name: "Av. Kabinda", district: "Lingwala", origin: { lat: -4.3280, lng: 15.3050 }, destination: { lat: -4.3350, lng: 15.3150 }, capacity: 5000 },
  { name: "Av. Itaga", district: "Kinshasa", origin: { lat: -4.3250, lng: 15.3020 }, destination: { lat: -4.3320, lng: 15.3100 }, capacity: 4500 },
  { name: "Av. Kalembe-Lembe", district: "Lingwala", origin: { lat: -4.3300, lng: 15.3000 }, destination: { lat: -4.3380, lng: 15.3080 }, capacity: 4500 },
  { name: "Av. de la Rwakadingi", district: "Barumbu", origin: { lat: -4.3180, lng: 15.3120 }, destination: { lat: -4.3250, lng: 15.3180 }, capacity: 4000 },
  { name: "Av. Kabambare", district: "Barumbu", origin: { lat: -4.3200, lng: 15.3100 }, destination: { lat: -4.3280, lng: 15.3250 }, capacity: 5500 },
  { name: "Av. Kato", district: "Barumbu", origin: { lat: -4.3220, lng: 15.3180 }, destination: { lat: -4.3100, lng: 15.3250 }, capacity: 4000 },

  // --- BANDALUNGWA / KINTAMBO (Zone résidentielle animée) ---
  { name: "Av. Libération (Moulaert)", district: "Bandalungwa", origin: { lat: -4.3500, lng: 15.2850 }, destination: { lat: -4.3350, lng: 15.3020 }, capacity: 7500 },
  { name: "Av. Kasa-Vubu (Bandal)", district: "Bandalungwa", origin: { lat: -4.3550, lng: 15.2900 }, destination: { lat: -4.3430, lng: 15.3120 }, capacity: 8000 },
  { name: "Av. Pierre Mulele", district: "Bandalungwa", origin: { lat: -4.3480, lng: 15.2820 }, destination: { lat: -4.3380, lng: 15.2950 }, capacity: 5000 },
  { name: "Av. Inga", district: "Bandalungwa", origin: { lat: -4.3520, lng: 15.2850 }, destination: { lat: -4.3600, lng: 15.2900 }, capacity: 3500 },
  { name: "Av. Kasa-Vubu (Kintambo)", district: "Kintambo", origin: { lat: -4.3320, lng: 15.2750 }, destination: { lat: -4.3450, lng: 15.2850 }, capacity: 6500 },
  { name: "Av. Lushiku", district: "Kintambo", origin: { lat: -4.3280, lng: 15.2700 }, destination: { lat: -4.3350, lng: 15.2780 }, capacity: 3000 },
  { name: "Av. Komoriko", district: "Kintambo", origin: { lat: -4.3300, lng: 15.2720 }, destination: { lat: -4.3200, lng: 15.2780 }, capacity: 3500 },
  { name: "Av. Bangala", district: "Kintambo", origin: { lat: -4.3350, lng: 15.2680 }, destination: { lat: -4.3250, lng: 15.2750 }, capacity: 4000 },
  { name: "Av. de l'OUA", district: "Kintambo", origin: { lat: -4.3220, lng: 15.2700 }, destination: { lat: -4.3150, lng: 15.2800 }, capacity: 5500 },
  { name: "Av. du Livre", district: "Bandalungwa", origin: { lat: -4.3420, lng: 15.2880 }, destination: { lat: -4.3480, lng: 15.2950 }, capacity: 3000 },

  // --- LEMBA / NGABA / MAKALA (Sud) ---
  { name: "Av. By-Pass (Triangle)", district: "Lemba", origin: { lat: -4.4100, lng: 15.3150 }, destination: { lat: -4.4250, lng: 15.3250 }, capacity: 9000 },
  { name: "Av. By-Pass (Salongo)", district: "Lemba", origin: { lat: -4.4250, lng: 15.3250 }, destination: { lat: -4.4550, lng: 15.3350 }, capacity: 9000 },
  { name: "Av. de l'Université (Intendance)", district: "Lemba", origin: { lat: -4.4200, lng: 15.3120 }, destination: { lat: -4.3950, lng: 15.3180 }, capacity: 7500 },
  { name: "Av. Kimwenza (Rizière)", district: "Ngaba", origin: { lat: -4.4050, lng: 15.3100 }, destination: { lat: -4.4200, lng: 15.3050 }, capacity: 4500 },
  { name: "Av. Elengesa (Pont)", district: "Makala", origin: { lat: -4.3720, lng: 15.3050 }, destination: { lat: -4.3950, lng: 15.3000 }, capacity: 6000 },
  { name: "Av. Sokele", district: "Lemba", origin: { lat: -4.4050, lng: 15.3200 }, destination: { lat: -4.4150, lng: 15.3300 }, capacity: 3500 },
  { name: "Av. Kianza", district: "Ngaba", origin: { lat: -4.4000, lng: 15.3150 }, destination: { lat: -4.3900, lng: 15.3350 }, capacity: 5500 },
  { name: "Av. Frère Zulu", district: "Lemba", origin: { lat: -4.4120, lng: 15.3180 }, destination: { lat: -4.4200, lng: 15.3250 }, capacity: 3000 },
  { name: "Av. Mobutu", district: "Lemba", origin: { lat: -4.4150, lng: 15.3220 }, destination: { lat: -4.4250, lng: 15.3320 }, capacity: 4000 },
  { name: "Av. de l'Église", district: "Makala", origin: { lat: -4.3850, lng: 15.3020 }, destination: { lat: -4.3950, lng: 15.3080 }, capacity: 3500 },

  // --- MATETE / NJILI / KIMBANSEKE (Est lointain) ---
  { name: "Av. Kabambare (Matete)", district: "Matete", origin: { lat: -4.3750, lng: 15.3650 }, destination: { lat: -4.3850, lng: 15.3800 }, capacity: 6000 },
  { name: "Av. Nzala", district: "Matete", origin: { lat: -4.3820, lng: 15.3700 }, destination: { lat: -4.3950, lng: 15.3750 }, capacity: 4000 },
  { name: "Av. Loukoussa (N'djili)", district: "N'djili", origin: { lat: -4.4050, lng: 15.4350 }, destination: { lat: -4.4200, lng: 15.4450 }, capacity: 5000 },
  { name: "Av. Mawunzi", district: "N'djili", origin: { lat: -4.4150, lng: 15.4400 }, destination: { lat: -4.4300, lng: 15.4500 }, capacity: 4500 },
  { name: "Route Mokali (Kimbanseke)", district: "Kimbanseke", origin: { lat: -4.4150, lng: 15.4120 }, destination: { lat: -4.4400, lng: 15.4250 }, capacity: 6500 },
  { name: "Av. Ngamilele", district: "Kimbanseke", origin: { lat: -4.4250, lng: 15.4200 }, destination: { lat: -4.4500, lng: 15.4350 }, capacity: 4000 },
  { name: "Av. de la Paix", district: "Masina", origin: { lat: -4.3800, lng: 15.4050 }, destination: { lat: -4.3950, lng: 15.4150 }, capacity: 5000 },
  { name: "Av. Masina Sans Fil", district: "Masina", origin: { lat: -4.3880, lng: 15.4100 }, destination: { lat: -4.3980, lng: 15.4250 }, capacity: 4500 },
  { name: "Av. Kulumba", district: "Masina", origin: { lat: -4.3780, lng: 15.3950 }, destination: { lat: -4.3880, lng: 15.4100 }, capacity: 4000 },
  { name: "Av. Batantou", district: "N'djili", origin: { lat: -4.4080, lng: 15.4420 }, destination: { lat: -4.4180, lng: 15.4550 }, capacity: 3500 },

  // --- AXES TRANSVERSAUX & COMPLÉMENTS ---
  { name: "Av. de la Libération (Camp Lufungula)", district: "Lingwala", origin: { lat: -4.3180, lng: 15.2950 }, destination: { lat: -4.3100, lng: 15.2850 }, capacity: 7000 },
  { name: "Av. Kabinda (Kabambare)", district: "Kinshasa", origin: { lat: -4.3350, lng: 15.3150 }, destination: { lat: -4.3250, lng: 15.3250 }, capacity: 5500 },
  { name: "Av. Landu (Selembao)", district: "Selembao", origin: { lat: -4.3750, lng: 15.2850 }, destination: { lat: -4.3950, lng: 15.2750 }, capacity: 4500 },
  { name: "Av. de la Libération (Selembao Junction)", district: "Selembao", origin: { lat: -4.3650, lng: 15.2800 }, destination: { lat: -4.3800, lng: 15.2750 }, capacity: 6500 },
  { name: "Av. Mushi (Ngiri-Ngiri)", district: "Ngiri-Ngiri", origin: { lat: -4.3520, lng: 15.2950 }, destination: { lat: -4.3620, lng: 15.3050 }, capacity: 4000 },
  { name: "Av. Oshwe (Ngiri-Ngiri)", district: "Ngiri-Ngiri", origin: { lat: -4.3550, lng: 15.2980 }, destination: { lat: -4.3680, lng: 15.3080 }, capacity: 3500 },
  { name: "Av. 24 Novembre (Bumbu)", district: "Bumbu", origin: { lat: -4.3680, lng: 15.2880 }, destination: { lat: -4.3850, lng: 15.2820 }, capacity: 5000 },
  { name: "Av. Kasapa (Bumbu)", district: "Bumbu", origin: { lat: -4.3750, lng: 15.2850 }, destination: { lat: -4.3820, lng: 15.2950 }, capacity: 3500 },
  { name: "Av. de la Démocratie (Ex Gombe)", district: "Gombe", origin: { lat: -4.3120, lng: 15.3100 }, destination: { lat: -4.3180, lng: 15.3150 }, capacity: 4500 },
  { name: "Av. Tabora (Barumbu Junction)", district: "Barumbu", origin: { lat: -4.3100, lng: 15.3180 }, destination: { lat: -4.3150, lng: 15.3250 }, capacity: 4000 },
  { name: "Av. du Plateau", district: "Kinshasa", origin: { lat: -4.3280, lng: 15.3080 }, destination: { lat: -4.3350, lng: 15.3120 }, capacity: 3500 },
  { name: "Av. Itaga (Marché Central)", district: "Kinshasa", origin: { lat: -4.3220, lng: 15.3050 }, destination: { lat: -4.3280, lng: 15.3120 }, capacity: 6000 },
  { name: "Av. de l'Hôtel (Ville)", district: "Gombe", origin: { lat: -4.3080, lng: 15.3120 }, destination: { lat: -4.3120, lng: 15.3180 }, capacity: 4000 },
  { name: "Av. Tombalbaye", district: "Gombe", origin: { lat: -4.3100, lng: 15.3150 }, destination: { lat: -4.3160, lng: 15.3100 }, capacity: 5500 },
  { name: "Av. des Marais", district: "Barumbu", origin: { lat: -4.3220, lng: 15.3350 }, destination: { lat: -4.3300, lng: 15.3450 }, capacity: 4500 },
  { name: "Av. Masimanimba", district: "Kalamu", origin: { lat: -4.3550, lng: 15.3220 }, destination: { lat: -4.3650, lng: 15.3320 }, capacity: 3500 },
  { name: "Av. de la Luanda", district: "Kalamu", origin: { lat: -4.3480, lng: 15.3150 }, destination: { lat: -4.3580, lng: 15.3250 }, capacity: 3500 },
  { name: "Av. Bongolo", district: "Kalamu", origin: { lat: -4.3600, lng: 15.3180 }, destination: { lat: -4.3720, lng: 15.3350 }, capacity: 6000 },
  { name: "Av. de la Tshuapa", district: "Kinshasa", origin: { lat: -4.3350, lng: 15.3050 }, destination: { lat: -4.3450, lng: 15.3120 }, capacity: 4000 },
  { name: "Av. Kimwenza (Gare Junction)", district: "Kalamu", origin: { lat: -4.3420, lng: 15.3180 }, destination: { lat: -4.3350, lng: 15.3250 }, capacity: 5000 },
];
