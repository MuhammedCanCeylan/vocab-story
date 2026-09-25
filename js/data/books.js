export const BOOKS = [
  {
    id:'last-train',
    title:'The Last Train',
    subtitle:'A small decision changes an ordinary evening.',
    level:'A2',
    genre:'Everyday mystery',
    minutes:18,
    cover:['#5a5ff0','#00a7bd'],
    chapters:[
      {
        title:'A Quiet Platform',
        summary:'Maya finishes work late and discovers that the station is almost empty.',
        sentences:[
          { text:'Maya left the office later than usual and hurried toward the station.', tr:'Maya ofisten her zamankinden daha geç çıktı ve istasyona doğru acele etti.' },
          { text:'She expected the platform to be crowded, but only three people were waiting there.', tr:'Peronun kalabalık olmasını bekliyordu ama orada sadece üç kişi bekliyordu.' },
          { text:'A cold wind moved through the station, so Maya pulled her coat tighter around her.', tr:'İstasyondan soğuk bir rüzgâr geçti, bu yüzden Maya paltosunu daha sıkı sardı.' },
          { text:'The screen above the platform said that the last train would arrive in twelve minutes.', tr:'Peronun üzerindeki ekran son trenin on iki dakika içinde geleceğini söylüyordu.' },
          { text:'Maya grabbed a coffee from the small machine and sat down near an old man with a blue bag.', tr:'Maya küçük makineden bir kahve aldı ve mavi çantalı yaşlı bir adamın yakınına oturdu.' },
          { text:'When the lights suddenly went out, everyone looked up at the same time.', tr:'Işıklar aniden sönünce herkes aynı anda başını kaldırdı.' }
        ],
        vocabulary:[
          {word:'expect',ipa:'/ɪkˈspekt/',definitionEn:'to think that something will probably happen',meaningTr:'beklemek, ummak',example:'I expect the bus to arrive soon.',type:'verb',level:'A2'},
          {word:'platform',ipa:'/ˈplæt.fɔːrm/',definitionEn:'the raised area beside a train where passengers wait',meaningTr:'peron',example:'We waited on platform three.',type:'noun',level:'A2'},
          {word:'grab',ipa:'/ɡræb/',definitionEn:'to take something quickly with your hand',meaningTr:'hızlıca almak, kapmak',example:'She grabbed her keys and left.',type:'verb',level:'A2'},
          {word:'go out',ipa:'/ɡoʊ aʊt/',definitionEn:'when a light stops shining',meaningTr:'sönmek',example:'The lights went out during the storm.',type:'phrasal verb',level:'A2'},
          {word:'at the same time',ipa:'/æt ðə seɪm taɪm/',definitionEn:'together, at one moment',meaningTr:'aynı anda',example:'They both laughed at the same time.',type:'phrase',level:'A2'}
        ],
        grammar:{title:'expect + object + to be',note:'Bir şeyin belli bir durumda olacağını beklerken expect + object + to + verb yapısını kullanabilirsin.',example:'She expected the platform to be crowded.'},
        quiz:[
          {q:'Why was Maya surprised when she reached the platform?', options:['It was almost empty.','The train had already left.','Her friend was waiting there.'], answer:0, explanation:'She expected a crowded platform, but only three people were there.'},
          {q:'What did Maya buy?', options:['A sandwich','A coffee','A ticket'], answer:1, explanation:'She grabbed a coffee from the small machine.'}
        ]
      },
      {
        title:'The Blue Bag',
        summary:'The lights return, but the old man and his bag are no longer where Maya expects them to be.',
        sentences:[
          { text:'A few seconds later, the lights came back and the station looked normal again.', tr:'Birkaç saniye sonra ışıklar geri geldi ve istasyon yeniden normal görünüyordu.' },
          { text:'Maya noticed that the old man had moved to the other end of the platform.', tr:'Maya yaşlı adamın peronun diğer ucuna geçtiğini fark etti.' },
          { text:'His blue bag, however, was still beside the bench where he had been sitting.', tr:'Ancak mavi çantası hâlâ oturduğu bankın yanındaydı.' },
          { text:'Maya picked it up and called out to him, but the arriving train was too loud.', tr:'Maya çantayı aldı ve ona seslendi ama gelen tren çok gürültülüydü.' },
          { text:'Instead of getting on the train, she ran toward the old man and handed the bag to him.', tr:'Trene binmek yerine yaşlı adama doğru koştu ve çantayı ona verdi.' },
          { text:'He smiled with relief and said, “You just saved my whole trip.”', tr:'Adam rahatlamış bir şekilde gülümsedi ve “Bütün yolculuğumu kurtardın.” dedi.' }
        ],
        vocabulary:[
          {word:'notice',ipa:'/ˈnoʊ.tɪs/',definitionEn:'to become aware of something',meaningTr:'fark etmek',example:'Did you notice the new sign?',type:'verb',level:'A2'},
          {word:'however',ipa:'/haʊˈev.ɚ/',definitionEn:'used to introduce a contrast',meaningTr:'ancak, bununla birlikte',example:'The room was small; however, it was comfortable.',type:'adverb',level:'A2'},
          {word:'pick up',ipa:'/pɪk ʌp/',definitionEn:'to lift something from a surface',meaningTr:'yerden almak',example:'Please pick up your bag.',type:'phrasal verb',level:'A2'},
          {word:'instead of',ipa:'/ɪnˈsted əv/',definitionEn:'in place of someone or something',meaningTr:'yerine',example:'We walked instead of taking a taxi.',type:'phrase',level:'A2'},
          {word:'relief',ipa:'/rɪˈliːf/',definitionEn:'a relaxed feeling after worry or pain ends',meaningTr:'rahatlama',example:'She felt relief when she found her passport.',type:'noun',level:'B1'}
        ],
        grammar:{title:'instead of + -ing',note:'Bir eylemin yerine başka bir eylem yaptığını söylerken instead of + verb-ing kullanılır.',example:'Instead of getting on the train, she ran toward the old man.'},
        quiz:[
          {q:'Why did Maya stay on the platform?', options:['She missed the train.','She wanted to return the bag.','She forgot her coffee.'], answer:1, explanation:'She chose to return the blue bag instead of getting on the train.'},
          {q:'How did the old man feel at the end?', options:['Angry','Confused','Relieved'], answer:2, explanation:'He smiled with relief after Maya returned the bag.'}
        ]
      }
    ]
  },
  {
    id:'small-cafe',
    title:'The Small Café',
    subtitle:'A simple conversation becomes a new friendship.',
    level:'A1',
    genre:'Daily life',
    minutes:14,
    cover:['#ef7b52','#d64f77'],
    chapters:[
      {
        title:'One Empty Table',
        summary:'Leo tries a new café near his apartment.',
        sentences:[
          {text:'Leo saw a small café near his apartment and decided to go inside.',tr:'Leo dairesinin yakınında küçük bir kafe gördü ve içeri girmeye karar verdi.'},
          {text:'There was one empty table next to the window.',tr:'Pencerenin yanında boş bir masa vardı.'},
          {text:'He ordered tea and a cheese sandwich from the woman behind the counter.',tr:'Tezgâhın arkasındaki kadından çay ve peynirli sandviç sipariş etti.'},
          {text:'While he waited, a girl asked, “Is this seat free?”',tr:'Beklerken bir kız “Bu koltuk boş mu?” diye sordu.'},
          {text:'Leo smiled and said, “Yes, of course.”',tr:'Leo gülümsedi ve “Evet, tabii ki.” dedi.'},
          {text:'They started talking about the rainy weather and the neighborhood.',tr:'Yağmurlu hava ve mahalle hakkında konuşmaya başladılar.'}
        ],
        vocabulary:[
          {word:'decide',ipa:'/dɪˈsaɪd/',definitionEn:'to choose what you will do',meaningTr:'karar vermek',example:'I decided to walk home.',type:'verb',level:'A1'},
          {word:'empty',ipa:'/ˈemp.ti/',definitionEn:'with nothing or nobody inside',meaningTr:'boş',example:'The bottle is empty.',type:'adjective',level:'A1'},
          {word:'order',ipa:'/ˈɔːr.dɚ/',definitionEn:'to ask for food or drink in a café or restaurant',meaningTr:'sipariş vermek',example:'I would like to order soup.',type:'verb',level:'A1'},
          {word:'seat',ipa:'/siːt/',definitionEn:'a place where you sit',meaningTr:'koltuk, oturacak yer',example:'Is this seat free?',type:'noun',level:'A1'},
          {word:'of course',ipa:'/əv kɔːrs/',definitionEn:'used to say yes in a friendly, clear way',meaningTr:'tabii ki',example:'Of course you can sit here.',type:'phrase',level:'A1'}
        ],
        grammar:{title:'There was / There were',note:'Geçmişte bir yerde bir şeyin varlığını anlatmak için there was / there were kullanılır.',example:'There was one empty table next to the window.'},
        quiz:[
          {q:'Where did Leo sit?',options:['Near the door','Next to the window','Outside'],answer:1,explanation:'The empty table was next to the window.'},
          {q:'What did Leo order?',options:['Coffee and cake','Tea and a sandwich','Water and salad'],answer:1,explanation:'He ordered tea and a cheese sandwich.'}
        ]
      },
      {
        title:'A New Friend',
        summary:'Leo discovers that he and Nora have several things in common.',
        sentences:[
          {text:'The girl introduced herself as Nora and said she had moved to the area last week.',tr:'Kız kendini Nora olarak tanıttı ve geçen hafta bölgeye taşındığını söyledi.'},
          {text:'Leo told her about a quiet park and a cheap market nearby.',tr:'Leo ona yakındaki sakin bir parktan ve ucuz bir marketten bahsetti.'},
          {text:'Nora was happy because she did not know the neighborhood well yet.',tr:'Nora mutluydu çünkü mahalleyi henüz iyi bilmiyordu.'},
          {text:'Before they left, they exchanged phone numbers.',tr:'Ayrılmadan önce telefon numaralarını birbirleriyle paylaştılar.'},
          {text:'“Maybe we can have coffee here again,” Nora said.',tr:'Nora “Belki burada tekrar kahve içebiliriz.” dedi.'},
          {text:'Leo walked home thinking that trying a new place had been a good idea.',tr:'Leo yeni bir yer denemenin iyi bir fikir olduğunu düşünerek eve yürüdü.'}
        ],
        vocabulary:[
          {word:'introduce',ipa:'/ˌɪn.trəˈduːs/',definitionEn:'to tell someone your name for the first time',meaningTr:'tanıştırmak, kendini tanıtmak',example:'Let me introduce myself.',type:'verb',level:'A1'},
          {word:'move',ipa:'/muːv/',definitionEn:'to start living in a different home or place',meaningTr:'taşınmak',example:'We moved here in May.',type:'verb',level:'A1'},
          {word:'nearby',ipa:'/ˌnɪrˈbaɪ/',definitionEn:'not far away',meaningTr:'yakında',example:'There is a pharmacy nearby.',type:'adverb',level:'A2'},
          {word:'exchange',ipa:'/ɪksˈtʃeɪndʒ/',definitionEn:'to give something and receive something similar',meaningTr:'karşılıklı değiş tokuş etmek',example:'We exchanged phone numbers.',type:'verb',level:'A2'},
          {word:'maybe',ipa:'/ˈmeɪ.bi/',definitionEn:'possibly',meaningTr:'belki',example:'Maybe I will call you tomorrow.',type:'adverb',level:'A1'}
        ],
        grammar:{title:'Past simple for completed events',note:'Hikâyede peş peşe tamamlanan olayları anlatmak için past simple kullanılır.',example:'They exchanged phone numbers and Leo walked home.'},
        quiz:[
          {q:'Why was Nora happy?',options:['Leo bought her coffee.','Leo knew useful places nearby.','She found a new apartment.'],answer:1,explanation:'Leo told her about a park and a market in the neighborhood.'},
          {q:'What did they exchange?',options:['Books','Phone numbers','Addresses'],answer:1,explanation:'They exchanged phone numbers before leaving.'}
        ]
      }
    ]
  },
  {
    id:'first-day',
    title:'The First Day',
    subtitle:'Starting a new job is uncomfortable until someone decides to help.',
    level:'B1',
    genre:'Work & communication',
    minutes:22,
    cover:['#1d8977','#1c566f'],
    chapters:[
      {
        title:'Too Many Names',
        summary:'Daniel starts work at a busy design studio and tries to keep up.',
        sentences:[
          {text:'Daniel arrived twenty minutes early because he did not want to make a bad first impression.',tr:'Daniel kötü bir ilk izlenim bırakmak istemediği için yirmi dakika erken geldi.'},
          {text:'Within the first hour, he had been introduced to so many people that he could hardly remember anyone’s name.',tr:'İlk bir saat içinde o kadar çok kişiyle tanıştırılmıştı ki neredeyse hiç kimsenin adını hatırlayamıyordu.'},
          {text:'His manager gave him a short tour, explained the current projects, and asked him to sit in on a client meeting.',tr:'Yöneticisi ona kısa bir tur yaptırdı, mevcut projeleri açıkladı ve bir müşteri toplantısına katılıp dinlemesini istedi.'},
          {text:'Daniel tried to take notes, but the team used several expressions he had never heard before.',tr:'Daniel not almaya çalıştı ama ekip daha önce hiç duymadığı birkaç ifade kullandı.'},
          {text:'Instead of pretending to understand everything, he wrote down the phrases and planned to look them up later.',tr:'Her şeyi anlıyormuş gibi yapmak yerine ifadeleri yazdı ve daha sonra araştırmayı planladı.'},
          {text:'By lunchtime, he felt exhausted but also curious about the work ahead.',tr:'Öğle yemeğine kadar kendini bitkin ama aynı zamanda önündeki iş hakkında meraklı hissediyordu.'}
        ],
        vocabulary:[
          {word:'first impression',ipa:'/fɝːst ɪmˈpreʃ.ən/',definitionEn:'the opinion you form when you first meet someone or experience something',meaningTr:'ilk izlenim',example:'A friendly greeting creates a good first impression.',type:'phrase',level:'B1'},
          {word:'sit in on',ipa:'/sɪt ɪn ɑːn/',definitionEn:'to attend a meeting mainly to observe',meaningTr:'gözlemci olarak katılmak',example:'Can I sit in on the meeting?',type:'phrasal verb',level:'B1'},
          {word:'pretend',ipa:'/prɪˈtend/',definitionEn:'to act as if something is true when it is not',meaningTr:'mış gibi yapmak',example:'He pretended to understand the joke.',type:'verb',level:'B1'},
          {word:'look up',ipa:'/lʊk ʌp/',definitionEn:'to search for information in a reference source',meaningTr:'araştırıp bulmak',example:'I looked the word up in a dictionary.',type:'phrasal verb',level:'B1'},
          {word:'exhausted',ipa:'/ɪɡˈzɔː.stɪd/',definitionEn:'extremely tired',meaningTr:'çok yorgun, bitkin',example:'I was exhausted after the long trip.',type:'adjective',level:'B1'}
        ],
        grammar:{title:'Past perfect passive',note:'Başka bir geçmiş olaydan önce tamamlanan ve öznesi önemli olmayan bir olayı had been + V3 ile anlatabilirsin.',example:'He had been introduced to so many people.'},
        quiz:[
          {q:'Why did Daniel arrive early?',options:['He had a meeting.','He wanted a good first impression.','He had the wrong time.'],answer:1,explanation:'He arrived early because he did not want to make a bad first impression.'},
          {q:'What did he do with unfamiliar phrases?',options:['He ignored them.','He asked to leave.','He wrote them down to research later.'],answer:2,explanation:'He chose to write the phrases down and look them up later.'}
        ]
      },
      {
        title:'Ask the Question',
        summary:'A teammate shows Daniel that asking clear questions is a professional skill, not a weakness.',
        sentences:[
          {text:'After lunch, a teammate named Priya noticed that Daniel was unusually quiet.',tr:'Öğle yemeğinden sonra Priya adlı bir ekip arkadaşı Daniel’ın alışılmadık derecede sessiz olduğunu fark etti.'},
          {text:'She told him that nobody expected a new employee to understand every process on the first day.',tr:'Ona hiç kimsenin yeni bir çalışanın ilk gün her süreci anlamasını beklemediğini söyledi.'},
          {text:'Priya encouraged him to ask questions as soon as something became unclear.',tr:'Priya bir şey belirsizleşir belirsizleşmez soru sorması için onu teşvik etti.'},
          {text:'During the afternoon meeting, Daniel finally asked what “scope creep” meant in their project.',tr:'Öğleden sonraki toplantıda Daniel sonunda projelerinde “scope creep” ifadesinin ne anlama geldiğini sordu.'},
          {text:'The project lead explained it without hesitation, and two other new employees quietly wrote the definition down.',tr:'Proje lideri tereddüt etmeden açıkladı ve diğer iki yeni çalışan tanımı sessizce not aldı.'},
          {text:'Daniel realized that one honest question had helped more people than just himself.',tr:'Daniel tek bir dürüst sorunun sadece kendisinden daha fazla kişiye yardım ettiğini fark etti.'}
        ],
        vocabulary:[
          {word:'unusually',ipa:'/ʌnˈjuː.ʒu.ə.li/',definitionEn:'in a way that is different from what normally happens',meaningTr:'alışılmadık biçimde',example:'The office was unusually quiet.',type:'adverb',level:'B1'},
          {word:'encourage',ipa:'/ɪnˈkɝː.ɪdʒ/',definitionEn:'to give someone confidence or support to do something',meaningTr:'teşvik etmek',example:'My teacher encouraged me to speak more.',type:'verb',level:'B1'},
          {word:'unclear',ipa:'/ˌʌnˈklɪr/',definitionEn:'not easy to understand',meaningTr:'belirsiz, anlaşılması zor',example:'The instructions were unclear.',type:'adjective',level:'B1'},
          {word:'without hesitation',ipa:'/wɪˈðaʊt ˌhez.əˈteɪ.ʃən/',definitionEn:'immediately and confidently, without waiting because of doubt',meaningTr:'tereddüt etmeden',example:'She agreed without hesitation.',type:'phrase',level:'B1'},
          {word:'realize',ipa:'/ˈriː.ə.laɪz/',definitionEn:'to understand something clearly, sometimes suddenly',meaningTr:'farkına varmak',example:'I realized I had left my phone at home.',type:'verb',level:'B1'}
        ],
        grammar:{title:'as soon as',note:'Bir olay olur olmaz diğerinin gerçekleştiğini anlatmak için as soon as kullanılır.',example:'Ask questions as soon as something becomes unclear.'},
        quiz:[
          {q:'What advice did Priya give Daniel?',options:['Stay quiet and observe.','Ask questions when something is unclear.','Read the company website.'],answer:1,explanation:'Priya encouraged him to ask questions as soon as he was unsure.'},
          {q:'Why was Daniel’s question useful?',options:['It helped other new employees too.','It ended the meeting early.','It changed the project plan.'],answer:0,explanation:'Other new employees also wrote down the explanation.'}
        ]
      }
    ]
  }
];

export function getBook(bookId) { return BOOKS.find(b => b.id === bookId) || BOOKS[0]; }
export function getChapter(bookId, chapterIndex=0) {
  const book = getBook(bookId);
  return { book, chapter: book.chapters[Math.max(0, Math.min(chapterIndex, book.chapters.length-1))], chapterIndex:Math.max(0, Math.min(chapterIndex, book.chapters.length-1)) };
}
