export interface District {
  name: string;
  bnName: string;
  division: string;
}

export const BD_DISTRICTS: District[] = [
  // Dhaka Division (13)
  { name: 'Dhaka', bnName: 'ঢাকা', division: 'Dhaka' },
  { name: 'Gazipur', bnName: 'গাজীপুর', division: 'Dhaka' },
  { name: 'Narayanganj', bnName: 'নারায়ণগঞ্জ', division: 'Dhaka' },
  { name: 'Tangail', bnName: 'টাঙ্গাইল', division: 'Dhaka' },
  { name: 'Kishoreganj', bnName: 'কিশোরগঞ্জ', division: 'Dhaka' },
  { name: 'Manikganj', bnName: 'মানিকগঞ্জ', division: 'Dhaka' },
  { name: 'Munshiganj', bnName: 'মুন্সীগঞ্জ', division: 'Dhaka' },
  { name: 'Narsingdi', bnName: 'নরসিংদী', division: 'Dhaka' },
  { name: 'Faridpur', bnName: 'ফরিদপুর', division: 'Dhaka' },
  { name: 'Gopalganj', bnName: 'গোপালগঞ্জ', division: 'Dhaka' },
  { name: 'Madaripur', bnName: 'মাদারীপুর', division: 'Dhaka' },
  { name: 'Rajbari', bnName: 'রাজবাড়ী', division: 'Dhaka' },
  { name: 'Shariatpur', bnName: 'শরীয়তপুর', division: 'Dhaka' },

  // Chattogram Division (11)
  { name: 'Chattogram', bnName: 'চট্টগ্রাম', division: 'Chattogram' },
  { name: "Cox's Bazar", bnName: 'কক্সবাজার', division: 'Chattogram' },
  { name: 'Cumilla', bnName: 'কুমিল্লা', division: 'Chattogram' },
  { name: 'Feni', bnName: 'ফেনী', division: 'Chattogram' },
  { name: 'Brahmanbaria', bnName: 'ব্রাহ্মণবাড়িয়া', division: 'Chattogram' },
  { name: 'Noakhali', bnName: 'নোয়াখালী', division: 'Chattogram' },
  { name: 'Chandpur', bnName: 'চাঁদপুর', division: 'Chattogram' },
  { name: 'Lakshmipur', bnName: 'লক্ষ্মীপুর', division: 'Chattogram' },
  { name: 'Rangamati', bnName: 'রাঙ্গামাটি', division: 'Chattogram' },
  { name: 'Khagrachhari', bnName: 'খাগড়াছড়ি', division: 'Chattogram' },
  { name: 'Bandarban', bnName: 'বান্দরবান', division: 'Chattogram' },

  // Rajshahi Division (8)
  { name: 'Rajshahi', bnName: 'রাজশাহী', division: 'Rajshahi' },
  { name: 'Bogura', bnName: 'বগুড়া', division: 'Rajshahi' },
  { name: 'Pabna', bnName: 'পাবনা', division: 'Rajshahi' },
  { name: 'Sirajganj', bnName: 'সিরাজগঞ্জ', division: 'Rajshahi' },
  { name: 'Naogaon', bnName: 'নওগাঁ', division: 'Rajshahi' },
  { name: 'Natore', bnName: 'নাটোর', division: 'Rajshahi' },
  { name: 'Chapainawabganj', bnName: 'চাঁপাইনবাবগঞ্জ', division: 'Rajshahi' },
  { name: 'Joypurhat', bnName: 'জয়পুরহাট', division: 'Rajshahi' },

  // Khulna Division (10)
  { name: 'Khulna', bnName: 'খুলনা', division: 'Khulna' },
  { name: 'Jashore', bnName: 'যশোর', division: 'Khulna' },
  { name: 'Kushtia', bnName: 'কুষ্টিয়া', division: 'Khulna' },
  { name: 'Jhenaidah', bnName: 'ঝিনাইদহ', division: 'Khulna' },
  { name: 'Satkhira', bnName: 'সাতক্ষীরা', division: 'Khulna' },
  { name: 'Bagerhat', bnName: 'বাগেরহাট', division: 'Khulna' },
  { name: 'Chuadanga', bnName: 'চুয়াডাঙ্গা', division: 'Khulna' },
  { name: 'Meherpur', bnName: 'মেহেরপুর', division: 'Khulna' },
  { name: 'Magura', bnName: 'মাগুরা', division: 'Khulna' },
  { name: 'Narail', bnName: 'নড়াইল', division: 'Khulna' },

  // Barishal Division (6)
  { name: 'Barishal', bnName: 'বরিশাল', division: 'Barishal' },
  { name: 'Patuakhali', bnName: 'পটুয়াখালী', division: 'Barishal' },
  { name: 'Bhola', bnName: 'ভোলা', division: 'Barishal' },
  { name: 'Pirojpur', bnName: 'পিরোজপুর', division: 'Barishal' },
  { name: 'Barguna', bnName: 'বরগুনা', division: 'Barishal' },
  { name: 'Jhalokati', bnName: 'ঝালকাঠি', division: 'Barishal' },

  // Sylhet Division (4)
  { name: 'Sylhet', bnName: 'সিলেট', division: 'Sylhet' },
  { name: 'Moulvibazar', bnName: 'মৌলভীবাজার', division: 'Sylhet' },
  { name: 'Habiganj', bnName: 'হবিগঞ্জ', division: 'Sylhet' },
  { name: 'Sunamganj', bnName: 'সুনামগঞ্জ', division: 'Sylhet' },

  // Rangpur Division (8)
  { name: 'Rangpur', bnName: 'রংপুর', division: 'Rangpur' },
  { name: 'Dinajpur', bnName: 'দিনাজপুর', division: 'Rangpur' },
  { name: 'Gaibandha', bnName: 'গাইবান্ধা', division: 'Rangpur' },
  { name: 'Kurigram', bnName: 'কুড়িগ্রাম', division: 'Rangpur' },
  { name: 'Lalmonirhat', bnName: 'লালমনিরহাট', division: 'Rangpur' },
  { name: 'Nilphamari', bnName: 'নীলফামারী', division: 'Rangpur' },
  { name: 'Panchagarh', bnName: 'পঞ্চগড়', division: 'Rangpur' },
  { name: 'Thakurgaon', bnName: 'ঠাকুরগাঁও', division: 'Rangpur' },

  // Mymensingh Division (4)
  { name: 'Mymensingh', bnName: 'ময়মনসিংহ', division: 'Mymensingh' },
  { name: 'Jamalpur', bnName: 'জামালপুর', division: 'Mymensingh' },
  { name: 'Netrokona', bnName: 'নেত্রকোণা', division: 'Mymensingh' },
  { name: 'Sherpur', bnName: 'শেরপুর', division: 'Mymensingh' },
];

export const BD_DISTRICT_NAMES = BD_DISTRICTS.map((d) => d.name);

// Complete Upazilas / Thanas for all Districts
export const DISTRICT_THANAS: Record<string, string[]> = {
  Dhaka: [
    'Uttara', 'Mirpur', 'Dhanmondi', 'Gulshan', 'Banani', 'Mohammadpur', 'Badda', 'Motijheel',
    'Jatrabari', 'Tejgaon', 'Khilgaon', 'Bashundhara R/A', 'Rampura', 'Lalbagh', 'Paltan',
    'Shahbagh', 'Malibagh', 'New Market', 'Mohakhali', 'Cantonment', 'Savar', 'Keraniganj',
    'Dhamrai', 'Dohar', 'Nawabganj', 'Ashulia'
  ],
  Gazipur: ['Gazipur Sadar', 'Tongi', 'Kaliakair', 'Kapasia', 'Sreepur', 'Kaliganj'],
  Narayanganj: ['Narayanganj Sadar', 'Fatullah', 'Siddhirganj', 'Bandar', 'Rupganj', 'Araihazar', 'Sonargaon'],
  Tangail: ['Tangail Sadar', 'Mirzapur', 'Gopalpur', 'Ghatail', 'Madhupur', 'Sakhipur', 'Kalihati', 'Bhuapur', 'Delduar', 'Nagarpur', 'Dhanbari', 'Basail'],
  Kishoreganj: ['Kishoreganj Sadar', 'Bhairab', 'Bajitpur', 'Katiadi', 'Karimganj', 'Kuliarchar', 'Pakundia', 'Hossainpur', 'Tarail', 'Itna', 'Mithamain', 'Nikli', 'Austagram'],
  Manikganj: ['Manikganj Sadar', 'Singair', 'Saturia', 'Ghior', 'Shivalaya', 'Harirampur', 'Daulatpur'],
  Munshiganj: ['Munshiganj Sadar', 'Sreenagar', 'Sirajdikhan', 'Tongibari', 'Louhajang', 'Gazaria'],
  Narsingdi: ['Narsingdi Sadar', 'Palash', 'Shibpur', 'Raipura', 'Monohardi', 'Belabo'],
  Faridpur: ['Faridpur Sadar', 'Boalmari', 'Bhanga', 'Madhukhali', 'Sadarpur', 'Nagarkanda', 'Charbhadrasan', 'Alfadanga', 'Saltha'],
  Gopalganj: ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara'],
  Madaripur: ['Madaripur Sadar', 'Shibchar', 'Kalkini', 'Rajoir', 'Dasar'],
  Rajbari: ['Rajbari Sadar', 'Goalanda', 'Pangsha', 'Baliakandi', 'Kalukhali'],
  Shariatpur: ['Shariatpur Sadar', 'Naria', 'Zajira', 'Bhedarganj', 'Damudya', 'Gosairhat'],

  Chattogram: [
    'Kotwali', 'Panchlaish', 'Pahartali', 'Halishahar', 'Agrabad', 'Double Mooring', 'Chawkbazar',
    'Khulshi', 'Bakalia', 'Patenga', 'Bayazid', 'Hathazari', 'Sitakunda', 'Mirsharai', 'Patiya',
    'Boalkhali', 'Anwara', 'Chandanaish', 'Rangunia', 'Raozan', 'Fatikchhari', 'Satkania', 'Lohagara', 'Banshkhali', 'Sandwip'
  ],
  "Cox's Bazar": ["Cox's Bazar Sadar", 'Teknaf', 'Ukhia', 'Chakaria', 'Ramu', 'Maheshkhali', 'Kutubdia', 'Pekua'],
  Cumilla: ['Cumilla Adarsha Sadar', 'Cumilla Sadar Dakshin', 'Laksam', 'Debidwar', 'Burichang', 'Brahmanpara', 'Chandina', 'Chauddagram', 'Daudkandi', 'Homna', 'Muradnagar', 'Barura', 'Monohargonj', 'Meghna', 'Titas'],
  Feni: ['Feni Sadar', 'Daganbhuiyan', 'Chhagalnaiya', 'Parshuram', 'Sonagazi', 'Fulgazi'],
  Brahmanbaria: ['Brahmanbaria Sadar', 'Ashuganj', 'Sarail', 'Kasba', 'Akhaura', 'Nabinagar', 'Bancharampur', 'Nasirnagar', 'Bijoynagar'],
  Noakhali: ['Noakhali Sadar (Sudharam)', 'Begumganj', 'Senbagh', 'Companiganj', 'Chatkhil', 'Hatiya', 'Subarnachar', 'Kabirhat', 'Sonaimuri'],
  Chandpur: ['Chandpur Sadar', 'Hajiganj', 'Matlab Uttar', 'Matlab Dakshin', 'Faridganj', 'Shahrasti', 'Kachua', 'Haimchar'],
  Lakshmipur: ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati', 'Kamalnagar'],
  Rangamati: ['Rangamati Sadar', 'Kaptai', 'Baghaichhari', 'Barkal', 'Langadu', 'Rajasthali', 'Belaichhari', 'Juraichhari', 'Naniarchar'],
  Khagrachhari: ['Khagrachhari Sadar', 'Dighinala', 'Panchhari', 'Mahalchhari', 'Matiranga', 'Manikchhari', 'Ramgarh', 'Guimara'],
  Bandarban: ['Bandarban Sadar', 'Ruma', 'Thanchi', 'Lama', 'Rowangchhari', 'Ali Kadam', 'Naikhongchhari'],

  Rajshahi: ['Boalia', 'Rajpara', 'Motihar', 'Chandrima', 'Paba', 'Godagari', 'Tanore', 'Mohanpur', 'Bagmara', 'Durgapur', 'Puthia', 'Charghat', 'Bagha'],
  Bogura: ['Bogura Sadar', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Gabtali', 'Kahaloo', 'Dhunat', 'Sariakandi', 'Nandigram', 'Sonatala', 'Adamdighi', 'Dupchanchia'],
  Pabna: ['Pabna Sadar', 'Ishwardi', 'Santhia', 'Bera', 'Sujanagar', 'Chatmohar', 'Faridpur', 'Bhangura', 'Atgharia'],
  Sirajganj: ['Sirajganj Sadar', 'Shahjadpur', 'Ullapara', 'Belkuchi', 'Kazipur', 'Kamarkhanda', 'Raiganj', 'Tarash', 'Chauhali'],
  Naogaon: ['Naogaon Sadar', 'Manda', 'Mohadevpur', 'Patnitala', 'Dhamoirhat', 'Niamatpur', 'Raninagar', 'Atrai', 'Porsha', 'Sapahar', 'Badalgachhi'],
  Natore: ['Natore Sadar', 'Singra', 'Baraigram', 'Gurudaspur', 'Lalpur', 'Bagatipara', 'Naldanga'],
  Chapainawabganj: ['Chapainawabganj Sadar', 'Shibganj', 'Gomastapur', 'Nachole', 'Bholahat'],
  Joypurhat: ['Joypurhat Sadar', 'Panchbibi', 'Kalai', 'Khetlal', 'Akkelpur'],

  Khulna: ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Khan Jahan Ali', 'Dumuria', 'Rupsha', 'Terokhada', 'Batiaghata', 'Dacope', 'Paikgachha', 'Koyra', 'Phultala', 'Dighalia'],
  Jashore: ['Jashore Sadar', 'Jhikargachha', 'Sharsha', 'Benapole', 'Manirampur', 'Keshabpur', 'Bagherpara', 'Abhaynagar', 'Chaugachha'],
  Kushtia: ['Kushtia Sadar', 'Kumarkhali', 'Mirpur', 'Bheramara', 'Daulatpur', 'Khoksa'],
  Jhenaidah: ['Jhenaidah Sadar', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa', 'Harinakunda'],
  Satkhira: ['Satkhira Sadar', 'Kalaroa', 'Tala', 'Kaliganj', 'Shyamnagar', 'Assasuni', 'Debhata'],
  Bagerhat: ['Bagerhat Sadar', 'Mongla', 'Fakirhat', 'Rampal', 'Morrelganj', 'Kachua', 'Sarankhola', 'Chitalmari', 'Mollahat'],
  Chuadanga: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar'],
  Meherpur: ['Meherpur Sadar', 'Gangni', 'Mujibnagar'],
  Magura: ['Magura Sadar', 'Sreepur', 'Mohammadpur', 'Shalikha'],
  Narail: ['Narail Sadar', 'Lohagara', 'Kalia'],

  Barishal: ['Barishal Sadar (Kotwali)', 'Bakerganj', 'Babuganj', 'Wazirpur', 'Banaripara', 'Gournadi', 'Agailjhara', 'Mehendiganj', 'Muladi', 'Hizla'],
  Patuakhali: ['Patuakhali Sadar', 'Galachipa', 'Kalapara (Kuakata)', 'Bauphal', 'Dumki', 'Mirzaganj', 'Dashmina', 'Rangabali'],
  Bhola: ['Bhola Sadar', 'Borhanuddin', 'Char Fasson', 'Lalmohan', 'Daulatkhan', 'Tazumuddin', 'Manpura'],
  Pirojpur: ['Pirojpur Sadar', 'Mathbaria', 'Bhandaria', 'Nesarabad (Swarupkati)', 'Nazirpur', 'Kawkhali', 'Zianagar (Indurkani)'],
  Barguna: ['Barguna Sadar', 'Amtali', 'Patharghata', 'Betagi', 'Bamna', 'Taltali'],
  Jhalokati: ['Jhalokati Sadar', 'Nalchity', 'Rajapur', 'Kathalia'],

  Sylhet: ['Kotwali', 'Jalalabad', 'Osmani Nagar', 'South Surma', 'Beanibazar', 'Golapganj', 'Zakiganj', 'Kanaighat', 'Fenchuganj', 'Balaganj', 'Companiganj', 'Gowainghat', 'Jaintiapur'],
  Moulvibazar: ['Moulvibazar Sadar', 'Sreemangal', 'Kamalganj', 'Kulaura', 'Rajnagar', 'Barlekha', 'Juri'],
  Habiganj: ['Habiganj Sadar', 'Madhabpur', 'Chunarughat', 'Nabiganj', 'Bahubal', 'Baniachong', 'Ajmiriganj', 'Lakhai', 'Shayestaganj'],
  Sunamganj: ['Sunamganj Sadar', 'Chhatak', 'Jagannathpur', 'Derai', 'Tahirpur', 'Dowarabazar', 'Bishwamvarpur', 'Jamalganj', 'Sullah', 'Shantiganj'],

  Rangpur: ['Kotwali', 'Tajhat', 'Mahi Ganj', 'Haragach', 'Pirgachha', 'Pirganj', 'Mithapukur', 'Badarganj', 'Gangachara', 'Kaunia', 'Taraganj'],
  Dinajpur: ['Dinajpur Sadar', 'Birganj', 'Kaharole', 'Biral', 'Bochaganj', 'Phulbari', 'Parbatipur', 'Nawabganj', 'Ghoraghat', 'Hakimpur (Hili)', 'Birol', 'Khansama', 'Chirirbandar'],
  Gaibandha: ['Gaibandha Sadar', 'Gobindaganj', 'Sundarganj', 'Palashbari', 'Sadullapur', 'Saghata', 'Phulchhari'],
  Kurigram: ['Kurigram Sadar', 'Nageshwari', 'Bhurungamari', 'Ulipur', 'Chilmari', 'Rajarhat', 'Rowmari', 'Char Rajibpur', 'Phulbari'],
  Lalmonirhat: ['Lalmonirhat Sadar', 'Patgram (Burimari)', 'Hatibandha', 'Kaliganj', 'Aditmari'],
  Nilphamari: ['Nilphamari Sadar', 'Saidpur', 'Domar', 'Dimla', 'Jaldhaka', 'Kishoreganj'],
  Panchagarh: ['Panchagarh Sadar', 'Tetulia (Banglabandha)', 'Boda', 'Debiganj', 'Atwari'],
  Thakurgaon: ['Thakurgaon Sadar', 'Pirganj', 'Ranisankail', 'Baliadangi', 'Haripur'],

  Mymensingh: ['Kotwali', 'Muktagachha', 'Trishal', 'Bhaluka', 'Fulbaria', 'Gafargaon', 'Gauripur', 'Ishwarganj', 'Haluaghat', 'Dhobaura', 'Nandail', 'Tara Khanda'],
  Jamalpur: ['Jamalpur Sadar', 'Sarishabari', 'Melandaha', 'Islampur', 'Dewanganj', 'Madarganj', 'Bakshiganj'],
  Netrokona: ['Netrokona Sadar', 'Kendua', 'Durgapur', 'Mohanganj', 'Kalmakanda', 'Barhatta', 'Atpara', 'Madan', 'Purbadhala', 'Khaliajuri'],
  Sherpur: ['Sherpur Sadar', 'Nalitabari', 'Nakla', 'Sreebardi', 'Jhenaigati'],
};

export function getThanasByDistrict(districtName: string): string[] {
  return DISTRICT_THANAS[districtName] || [];
}
