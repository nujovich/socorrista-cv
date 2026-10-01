/* ===== Casos ===== 
   { id, env, sit, title, victim, scene, scenePA?, rescue?:[steps], paPrefix?:[steps only in PA scope], pa:[steps], notes?:[T] } */

const CASES = [

/* ---------------------------------------------------------------- 1 */
{
  id: 'pis-ahog4', env: 'piscina', sit: 'ahogamiento', tags: ['rcp'],
  title: T('Ahogamiento grado 4 en zona profunda', 'Ofegament grau 4 en zona profunda'),
  victim: T('Hombre de unos 45 años', 'Home d\'uns 45 anys'),
  scene: T('Piscina municipal cubierta, 17:30, afluencia media. Desde la silla ves a un hombre flotando boca abajo e inmóvil en la zona profunda (2,2 m), junto a la corchera. Nadie a su alrededor ha reaccionado. Llevas el tubo de rescate en bandolera; tu compañera está en el puesto del vaso pequeño y el DESA está en la enfermería, a 30 m.',
            'Piscina municipal coberta, 17:30, afluència mitjana. Des de la cadira veus un home flotant boca avall i immòbil en la zona profunda (2,2 m), al costat de la surera. Ningú al seu voltant ha reaccionat. Portes el tub de rescat en bandolera; la teua companya està en el lloc del vas xicotet i el DESA està en la infermeria, a 30 m.'),
  scenePA: T('Tu compañera y tú acabáis de sacar del agua a un hombre que flotaba boca abajo. Está tumbado boca arriba en el bordillo, mojado, con los labios azulados. El DESA viene de camino y el 112 está avisado.',
              'La teua companya i tu acabeu de traure de l\'aigua un home que flotava boca avall. Està gitat boca amunt en la vorera, mullat, amb els llavis blavosos. El DESA ve de camí i el 112 està avisat.'),
  rescue: [STEP.signal(), STEP.entryPool(), STEP.approach(), STEP.controlUnconsciousPool(), STEP.towPool(), STEP.extractPool()],
  pa: [STEP.consciousness(), STEP.airwayCervical(), STEP.breathingCheck(), STEP.fiveBreaths(), STEP.confirm112(), STEP.cpr(), STEP.desaWet(false), STEP.continueCpr()],
  notes: [T('Orden de prioridad para ventilar al ahogado (RFESS): 1.º balón con reservorio y O₂, 2.º balón con O₂, 3.º balón con aire, 4.º boca a boca con dispositivo unidireccional, 5.º boca a boca directo.',
            'Ordre de prioritat per a ventilar l\'ofegat (RFESS): 1r baló amb reservori i O₂, 2n baló amb O₂, 3r baló amb aire, 4t boca a boca amb dispositiu unidireccional, 5é boca a boca directe.')]
},

/* ---------------------------------------------------------------- 2 */
{
  id: 'pis-lm', env: 'piscina', sit: 'medular',
  title: T('Lesión medular por zambullida en zona poco profunda', 'Lesió medul·lar per capbussada en zona poc profunda'),
  victim: T('Chica de 17 años, consciente', 'Xica de 17 anys, conscient'),
  scene: T('Piscina descubierta, 13:00. Una chica se ha tirado de cabeza en la zona de 1,20 m. Sale a la superficie agarrada a la corchera, muy quieta, con dolor intenso en el cuello y hormigueo en los brazos. Respira y habla. Hay un segundo socorrista en el vaso de al lado y el tablero espinal con collarines está en el puesto.',
            'Piscina descoberta, 13:00. Una xica s\'ha tirat de cap en la zona d\'1,20 m. Ix a la superfície agafada a la surera, molt quieta, amb dolor intens en el coll i formigueig en els braços. Respira i parla. Hi ha un segon socorrista en el vas del costat i el tauler espinal amb collarins està en el lloc.'),
  scenePA: T('Unos bañistas han sacado del agua a una chica que se tiró de cabeza en la zona de 1,20 m. La han sentado en el bordillo: se queja de dolor intenso en el cuello y hormigueo en los brazos. Respira y habla. El tablero y los collarines están en el puesto; tu compañero viene hacia aquí.',
              'Uns banyistes han tret de l\'aigua una xica que es va tirar de cap en la zona d\'1,20 m. L\'han asseguda en la vorera: es queixa de dolor intens en el coll i formigueig en els braços. Respira i parla. El tauler i els collarins estan en el lloc; el teu company ve cap ací.'),
  rescue: [
    { t: T('Señal de rescate en marcha y petición expresa de material: collarín, tablero espinal y el segundo socorrista; que se active el 112 describiendo "zambullida con dolor cervical".',
           'Senyal de rescat en marxa i petició expressa de material: collarí, tauler espinal i el segon socorrista; que s\'active el 112 descrivint "capbussada amb dolor cervical".'),
      why: T('PAS para lesión medular: Proteger, Avisar (112 + material) y Socorrer. Sin tablero y sin un segundo socorrista no hay inmovilización posible.',
             'PAS per a lesió medul·lar: Protegir, Avisar (112 + material) i Socórrer. Sense tauler i sense un segon socorrista no hi ha immobilització possible.'),
      ref: 'Salvamento C11 PAS para LM',
      alts: [
        { t: T('Entrar al agua y sacarla rápido antes de que se canse.', 'Entrar a l\'aigua i traure-la ràpid abans que es canse.'),
          why: T('Respira y está estable: lo urgente es inmovilizar bien, no sacarla deprisa. Pide primero el material.', 'Respira i està estable: l\'urgent és immobilitzar bé, no traure-la de pressa. Demana primer el material.') },
        { crit: true, t: T('Decirle que nade despacio hasta la escalera.', 'Dir-li que nede a poc a poc fins a l\'escala.'),
          why: T('Cualquier movimiento del cuello puede convertir una lesión estable en una tetraplejia.', 'Qualsevol moviment del coll pot convertir una lesió estable en una tetraplegia.') }
      ] },
    { t: T('Entra al agua suavemente, sin salto ni salpicaduras, y aproxímate sin generar oleaje.',
           'Entra a l\'aigua suaument, sense salt ni esquitxos, i aproxima\'t sense generar onatge.'),
      why: T('El agua en movimiento moviliza el cuello de la víctima; la entrada y la aproximación son suaves.',
             'L\'aigua en moviment mobilitza el coll de la víctima; l\'entrada i l\'aproximació són suaus.'),
      ref: 'Protocolo LM consciente (RFESS cap. 11)',
      alts: [
        { t: T('Paso de gigante con el tubo, como en cualquier rescate.', 'Pas de gegant amb el tub, com en qualsevol rescat.'),
          why: T('Aquí el material útil es el tablero; la entrada debe ser suave para no mover el agua.', 'Ací el material útil és el tauler; l\'entrada ha de ser suau per a no moure l\'aigua.') },
        { crit: true, t: T('Entrada de cabeza para llegar antes.', 'Entrada de cap per a arribar abans.'),
          why: T('A 1,20 m te juegas tu propia columna; y el oleaje mueve el cuello de la víctima.', 'A 1,20 m et jugues la teua pròpia columna; i l\'onatge mou el coll de la víctima.') }
      ] },
    { t: T('Control con la técnica de tracción: manos en la cabeza, tracción cervical constante y cuerpo alineado flotando en posición neutra; recoloca el cuello solo si no provoca dolor.',
           'Control amb la tècnica de tracció: mans en el cap, tracció cervical constant i cos alineat flotant en posició neutra; recol·loca el coll només si no provoca dolor.'),
      why: T('La tracción es la única técnica que libera la tensión intervertebral y mantiene el eje. Si recolocar duele, el collarín se pone en la posición en que está el cuello.',
             'La tracció és l\'única tècnica que allibera la tensió intervertebral i manté l\'eix. Si recol·locar fa mal, el collarí es posa en la posició en què està el coll.'),
      ref: 'Salvamento C10 Técnicas · RFESS cap. 10',
      alts: [
        { t: T('Técnica del torno.', 'Tècnica del torn.'),
          why: T('Es válida para girar, pero no tracciona ni libera tensión y es muy exigente; la RFESS recomienda la tracción.', 'És vàlida per a girar, però no tracciona ni allibera tensió i és molt exigent; la RFESS recomana la tracció.') },
        { crit: true, t: T('Sacarla tirando de los brazos hacia el bordillo.', 'Traure-la tirant dels braços cap a la vorera.'),
          why: T('Flexión y rotación del cuello sin control: puedes completar la lesión.', 'Flexió i rotació del coll sense control: pots completar la lesió.') },
        { crit: true, t: T('Forzar la cabeza a la posición neutra aunque grite de dolor.', 'Forçar el cap a la posició neutra encara que cride de dolor.'),
          why: T('Si duele, no se recoloca: se inmoviliza en la posición encontrada.', 'Si fa mal, no es recol·loca: s\'immobilitza en la posició trobada.') }
      ] },
    { t: T('Háblale continuamente: así evalúas la consciencia, la tranquilizas y vigilas la respiración; pide que tengan cerca el balón resucitador y la cánula de Guedel.',
           'Parla-li contínuament: així avalues la consciència, la tranquil·litzes i vigiles la respiració; demana que tinguen prop el baló resuscitador i la cànula de Guedel.'),
      why: T('Una lesión alta (C3-C5) puede detener la respiración en cualquier momento: el Ambú y la cánula tienen que estar a mano.',
             'Una lesió alta (C3-C5) pot detindre la respiració en qualsevol moment: l\'Ambú i la cànula han d\'estar a mà.'),
      ref: 'RFESS cap. 11 · C10',
      alts: [
        { t: T('Dejar de hablarle para concentrarte en la tracción.', 'Deixar de parlar-li per a concentrar-te en la tracció.'),
          why: T('Hablar es tu monitor de consciencia y respiración; además la calma y evita que se mueva.', 'Parlar és el teu monitor de consciència i respiració; a més la calma i evita que es moga.') },
        { crit: true, t: T('Darle un poco de agua para que se tranquilice.', 'Donar-li un poc d\'aigua perquè es tranquil·litze.'),
          why: T('Nada por boca: riesgo de aspiración si pierde la consciencia o deja de respirar.', 'Res per boca: risc d\'aspiració si perd la consciència o deixa de respirar.') }
      ] },
    { t: T('Con el segundo socorrista: tú mantienes la tracción constante mientras él mide y coloca el collarín (sin cerrarlo en exceso).',
           'Amb el segon socorrista: tu mantens la tracció constant mentre ell mesura i col·loca el collarí (sense tancar-lo en excés).'),
      why: T('Un socorrista tracciona, el otro coloca. Errores típicos: talla incorrecta y cierre excesivo. El Ambu de 16 graduaciones es ideal en el agua.',
             'Un socorrista tracciona, l\'altre col·loca. Errors típics: talla incorrecta i tancament excessiu. L\'Ambu de 16 graduacions és ideal en l\'aigua.'),
      ref: 'Salvamento C11 Colocación collarín + tablero',
      alts: [
        { crit: true, t: T('Soltar la tracción un momento para ayudar a cerrar el collarín.', 'Soltar la tracció un moment per a ajudar a tancar el collarí.'),
          why: T('La tracción no se suelta nunca hasta que esté inmovilizada sobre el tablero.', 'La tracció no es solta mai fins que estiga immobilitzada sobre el tauler.') },
        { t: T('Ponerle el collarín tú sola con una mano.', 'Posar-li el collarí tu sola amb una mà.'),
          why: T('Mínimo dos socorristas: uno tracciona, otro mide y coloca.', 'Mínim dos socorristes: un tracciona, l\'altre mesura i col·loca.') }
      ] },
    { t: T('Tablero espinal: se introduce perpendicular bajo la espalda; cinchas en orden tórax → caderas → piernas; inmovilizador de cabeza (Dama de Elche) con cinta en frente y barbilla.',
           'Tauler espinal: s\'introduïx perpendicular davall l\'esquena; cintes en orde tòrax → malucs → cames; immobilitzador de cap (Dama d\'Elx) amb cinta en front i barbeta.'),
      why: T('El orden de las cinchas fija primero el tronco; la cabeza se inmoviliza al final con el tetracameral sin soltar la tracción manual hasta que esté fijada.',
             'L\'orde de les cintes fixa primer el tronc; el cap s\'immobilitza al final amb el tetracameral sense soltar la tracció manual fins que estiga fixada.'),
      ref: 'Salvamento C2 y C11',
      alts: [
        { t: T('Fijar primero las piernas y la cabeza, y el tórax al final.', 'Fixar primer les cames i el cap, i el tòrax al final.'),
          why: T('El orden es tórax → caderas → piernas, y la cabeza con la Dama de Elche al final.', 'L\'orde és tòrax → malucs → cames, i el cap amb la Dama d\'Elx al final.') },
        { t: T('No poner la Dama de Elche porque ya lleva collarín.', 'No posar la Dama d\'Elx perquè ja porta collarí.'),
          why: T('El collarín limita, no inmoviliza: el tetracameral fija la cabeza al tablero.', 'El collarí limita, no immobilitza: el tetracameral fixa el cap al tauler.') }
      ] },
    { t: T('Extracción rasante por el bordillo manteniendo la tracción en todo momento; puede llevar 5-8 minutos y no se acelera.',
           'Extracció arran per la vorera mantenint la tracció en tot moment; pot portar 5-8 minuts i no s\'accelera.'),
      why: T('Las prisas son el enemigo de la lesión medular: izado manteniendo tracción mayor que empuje, y tumbar sin soltar.',
             'Les presses són l\'enemic de la lesió medul·lar: hissat mantenint tracció major que espenta, i gitar sense soltar.'),
      ref: 'Salvamento C8 y C11',
      alts: [
        { t: T('Acelerar la extracción porque está empezando a tener frío.', 'Accelerar l\'extracció perquè està començant a tindre fred.'),
          why: T('Se vigila la hipotermia, pero la extracción de una LM nunca se precipita; abrígala en cuanto esté fuera.', 'Es vigila la hipotèrmia, però l\'extracció d\'una LM mai es precipita; abriga-la tan prompte com estiga fora.') },
        { crit: true, t: T('Sacarla sentada por la escalera.', 'Traure-la asseguda per l\'escala.'),
          why: T('Flexiona la columna: contraindicado con sospecha de lesión medular.', 'Flexiona la columna: contraindicat amb sospita de lesió medul·lar.') }
      ] }
  ],
  paPrefix: [
    { t: T('Dile que no se mueva, controla la cabeza con las dos manos (bimanual) y, con ayuda de al menos dos personas, túmbala en bloque en decúbito supino: quien sujeta la cabeza dirige la maniobra.',
           'Digues-li que no es moga, controla el cap amb les dos mans (bimanual) i, amb ajuda d\'almenys dos persones, gita-la en bloc en decúbit supí: qui subjecta el cap dirigix la maniobra.'),
      why: T('Movilizar lo mínimo indispensable y siempre en bloque; el que sujeta la cabeza dirige. Sentada, la columna soporta carga.',
             'Mobilitzar el mínim indispensable i sempre en bloc; el que subjecta el cap dirigix. Asseguda, la columna suporta càrrega.'),
      ref: 'U12 Recogida y transporte',
      alts: [
        { crit: true, t: T('Pedirle que se tumbe ella misma despacio.', 'Demanar-li que es gite ella mateixa a poc a poc.'),
          why: T('Cualquier movimiento activo del cuello puede agravar la lesión.', 'Qualsevol moviment actiu del coll pot agreujar la lesió.') },
        { t: T('Dejarla sentada para que esté más cómoda hasta que llegue el SVA.', 'Deixar-la asseguda perquè estiga més còmoda fins que arribe el SVA.'),
          why: T('La columna cargada y sin control: decúbito supino con control cervical.', 'La columna carregada i sense control: decúbit supí amb control cervical.') }
      ] },
    { t: T('Pide collarín y tablero, y avisa al 112 describiendo el mecanismo: zambullida en zona poco profunda con dolor cervical y hormigueo.',
           'Demana collarí i tauler, i avisa el 112 descrivint el mecanisme: capbussada en zona poc profunda amb dolor cervical i formigueig.'),
      why: T('La compresión axial por zambullida es el mecanismo más común de LM en el agua; describirlo orienta al SVA.',
             'La compressió axial per capbussada és el mecanisme més comú de LM en l\'aigua; descriure-ho orienta el SVA.'),
      ref: 'Salvamento C10',
      alts: [
        { t: T('Esperar a ver si el dolor se pasa antes de avisar.', 'Esperar a vore si el dolor passa abans d\'avisar.'),
          why: T('Dolor cervical más hormigueo tras zambullida = LM hasta que se demuestre lo contrario: 112 ya.', 'Dolor cervical més formigueig després de capbussada = LM fins que es demostre el contrari: 112 ja.') }
      ] },
    { t: T('Con tu compañero: uno mantiene la tracción y el otro mide y coloca el collarín; después, tablero con tres personas (rodamiento en bloque), cinchas tórax → caderas → piernas y Dama de Elche.',
           'Amb el teu company: un manté la tracció i l\'altre mesura i col·loca el collarí; després, tauler amb tres persones (rodament en bloc), cintes tòrax → malucs → cames i Dama d\'Elx.'),
      why: T('Inmovilización completa: collarín + inmovilizador tetracameral + tablero. Ante la duda, tratar como lesión medular.',
             'Immobilització completa: collarí + immobilitzador tetracameral + tauler. En cas de dubte, tractar com a lesió medul·lar.'),
      ref: 'U19 Politraumatizado',
      alts: [
        { t: T('Collarín y ya está; el tablero solo si pierde fuerza en las piernas.', 'Collarí i ja està; el tauler només si perd força en les cames.'),
          why: T('El collarín solo no inmoviliza; con mecanismo y síntomas, inmovilización completa.', 'El collarí sol no immobilitza; amb mecanisme i símptomes, immobilització completa.') }
      ] }
  ],
  pa: [
    { t: T('Fuera del agua, valoración ABCDE con control cervical: vía aérea, respiración (frecuencia y profundidad), pulso, consciencia (AVDN) y exposición; reevalúa sin dejar de hablarle.',
           'Fora de l\'aigua, valoració ABCDE amb control cervical: via aèria, respiració (freqüència i profunditat), pols, consciència (AVDN) i exposició; reavalua sense deixar de parlar-li.'),
      why: T('A con control cervical, B vigilando que no aparezca parada respiratoria, D con AVDN o Glasgow. La valoración se repite.',
             'A amb control cervical, B vigilant que no aparega parada respiratòria, D amb AVDN o Glasgow. La valoració es repetix.'),
      ref: 'U11 ABCDE · corrección 28-09',
      alts: [
        { crit: true, t: T('Colocarla en PLS por si vomita.', 'Col·locar-la en PLS per si vomita.'),
          why: T('La PLS está contraindicada ante sospecha de lesión medular: está consciente y respira, se mantiene en decúbito supino inmovilizada.', 'La PLS està contraindicada davant sospita de lesió medul·lar: està conscient i respira, es manté en decúbit supí immobilitzada.') },
        { t: T('Saltarte la valoración porque ya has visto que habla.', 'Saltar-te la valoració perquè ja has vist que parla.'),
          why: T('Hablar no descarta una parada respiratoria posterior ni un shock neurogénico: ABCDE completo y repetido.', 'Parlar no descarta una parada respiratòria posterior ni un xoc neurogènic: ABCDE complet i repetit.') }
      ] },
    { t: T('E: abrígala con manta térmica (sale mojada), afloja lo que comprima y mantén la inmovilización sobre el tablero hasta la transferencia al SVA, con control de constantes.',
           'E: abriga-la amb manta tèrmica (ix mullada), afluixa el que comprimisca i manté la immobilització sobre el tauler fins a la transferència al SVA, amb control de constants.'),
      why: T('En el medio acuático la E es más urgente: la hipotermia llega en minutos y enmascara signos vitales. El shock neurogénico cursa con bradicardia y vasodilatación.',
             'En el medi aquàtic la E és més urgent: la hipotèrmia arriba en minuts i emmascara signes vitals. El xoc neurogènic cursa amb bradicàrdia i vasodilatació.'),
      ref: 'U20 Shock · corrección 28-09',
      alts: [
        { t: T('Quitarle las cinchas para que esté más cómoda mientras espera.', 'Llevar-li les cintes perquè estiga més còmoda mentre espera.'),
          why: T('La inmovilización se mantiene hasta que el SVA decida.', 'La immobilització es manté fins que el SVA decidisca.') },
        { crit: true, t: T('Levantarle las piernas en posición antishock.', 'Alçar-li les cames en posició antixoc.'),
          why: T('Moviliza la columna sobre el tablero; con LM la posición es decúbito supino alineado.', 'Mobilitza la columna sobre el tauler; amb LM la posició és decúbit supí alineat.') }
      ] }
  ],
  notes: [T('El 80 % de las lesiones medulares en el medio acuático ocurren en aguas poco profundas; el mecanismo más común es la compresión axial por zambullida. Regla de oro: todo inconsciente en el agua es LM hasta que se demuestre lo contrario.',
            'El 80 % de les lesions medul·lars en el medi aquàtic ocorren en aigües poc profundes; el mecanisme més comú és la compressió axial per capbussada. Regla d\'or: tot inconscient en l\'aigua és LM fins que es demostre el contrari.')]
},

/* ---------------------------------------------------------------- 3 */
{
  id: 'pis-convuls', env: 'piscina', sit: 'convulsion',
  title: T('Crisis convulsiva dentro del agua', 'Crisi convulsiva dins de l\'aigua'),
  victim: T('Chico de 16 años', 'Xic de 16 anys'),
  scene: T('Piscina cubierta, calle 4, zona de 1,50 m. Un chico que nadaba tranquilo se queda rígido, se hunde y empieza a convulsionar con la cara dentro del agua. Sus amigos gritan. Tienes el tubo de rescate; en el puesto también hay una boya torpedo.',
            'Piscina coberta, carrer 4, zona d\'1,50 m. Un xic que nedava tranquil es queda rígid, s\'enfonsa i comença a convulsionar amb la cara dins de l\'aigua. Els seus amics criden. Tens el tub de rescat; en el lloc també hi ha una boia torpede.'),
  scenePA: T('Acabáis de sacar a un chico de 16 años que ha convulsionado dentro del agua. Las sacudidas ya han cesado; está en el bordillo, inconsciente, respira con ronquido y tiene un poco de espuma en la boca.',
              'Acabeu de traure un xic de 16 anys que ha convulsionat dins de l\'aigua. Les sacsejades ja han cessat; està en la vorera, inconscient, respira amb ronc i té un poc d\'escuma en la boca.'),
  rescue: [
    STEP.signal(),
    { t: T('Entra con el tubo de rescate (no con la boya torpedo) con paso de gigante y aproxímate con la cabeza fuera.',
           'Entra amb el tub de rescat (no amb la boia torpede) amb pas de gegant i aproxima\'t amb el cap fora.'),
      why: T('La boya torpedo no se recomienda en crisis convulsivas por su rigidez: puede golpear a la víctima. El tubo es blando y flexible.',
             'La boia torpede no es recomana en crisis convulsives per la seua rigidesa: pot colpejar la víctima. El tub és bla i flexible.'),
      ref: 'Salvamento C9 Situaciones especiales',
      alts: [
        { t: T('Coger la boya torpedo porque flota más.', 'Agafar la boia torpede perquè flota més.'),
          why: T('Rígida: golpea a una víctima que convulsiona. Tubo de rescate.', 'Rígida: colpeja una víctima que convulsiona. Tub de rescat.') },
        { crit: true, t: T('Entrar en picado desde el bordillo para llegar antes.', 'Entrar en picat des de la vorera per a arribar abans.'),
          why: T('1,50 m: el picado no se hace en piscinas.', '1,50 m: el picat no es fa en piscines.') }
      ] },
    { t: T('Control: gíralo boca arriba si está ventral y mantén las vías aéreas fuera del agua con la cabeza ladeada; no metas nada en su boca ni intentes frenar las sacudidas.',
           'Control: gira\'l boca amunt si està ventral i manté les vies aèries fora de l\'aigua amb el cap de costat; no fiques res en la seua boca ni intentes frenar les sacsejades.'),
      why: T('Durante la crisis la lengua no cae hacia atrás (mantiene tono); la apnea tónica dura 30-45 s y se resuelve sola en más del 90 % de los casos. Sujeta suavemente, sin impedir el movimiento.',
             'Durant la crisi la llengua no cau cap arrere (manté to); l\'apnea tònica dura 30-45 s i es resol sola en més del 90 % dels casos. Subjecta suaument, sense impedir el moviment.'),
      ref: 'RFESS cap. 9 · Salvamento C9',
      alts: [
        { crit: true, t: T('Meterle el tubo o los dedos en la boca para que no se muerda la lengua.', 'Ficar-li el tub o els dits en la boca perquè no es mossegue la llengua.'),
          why: T('Nunca objetos en la boca: lesiones, fractura dental, obstrucción y mordedura para ti.', 'Mai objectes en la boca: lesions, fractura dental, obstrucció i mossegada per a tu.') },
        { t: T('Sujetarlo con fuerza para parar las convulsiones.', 'Subjectar-lo amb força per a parar les convulsions.'),
          why: T('No se impiden los movimientos: se acompañan y se evita que se golpee.', 'No s\'impedixen els moviments: s\'acompanyen i s\'evita que es colpege.') },
        { t: T('Extraerlo inmediatamente en plena crisis.', 'Extraure\'l immediatament en plena crisi.'),
          why: T('Se espera a que cesen las contracciones antes de extraer; mientras tanto, control y vías aéreas fuera.', 'S\'espera que cessen les contraccions abans d\'extraure; mentrestant, control i vies aèries fora.') }
      ] },
    { t: T('Mantén el control con el tubo hasta que cesen las contracciones (fase tónica 1-2 min, clónica 2-5 min); si pasa de 5 minutos es grave: confirma que el 112 está activado.',
           'Manté el control amb el tub fins que cessen les contraccions (fase tònica 1-2 min, clònica 2-5 min); si passa de 5 minuts és greu: confirma que el 112 està activat.'),
      why: T('Fases de la crisis: tónica, clónica y postcrítica (>5 min). Una crisis de más de 5 minutos es una emergencia.',
             'Fases de la crisi: tònica, clònica i postcrítica (>5 min). Una crisi de més de 5 minuts és una emergència.'),
      ref: 'Salvamento C9 · U21',
      alts: [
        { t: T('Soltarlo un momento para avisar tú por la emisora.', 'Soltar-lo un moment per a avisar tu per l\'emissora.'),
          why: T('No se suelta nunca a una víctima que convulsiona en el agua; el aviso lo hace el equipo tras la señal.', 'No es solta mai una víctima que convulsiona en l\'aigua; l\'avís el fa l\'equip després del senyal.') }
      ] },
    { t: T('Al cesar las contracciones: remolca y extrae con ayuda, evitando golpes, y túmbalo en el bordillo.',
           'En cessar les contraccions: remolca i extrau amb ajuda, evitant colps, i gita\'l en la vorera.'),
      why: T('Fuera del agua se sigue el protocolo terrestre de la crisis convulsiva.',
             'Fora de l\'aigua se seguix el protocol terrestre de la crisi convulsiva.'),
      ref: 'RFESS cap. 9',
      alts: [
        { t: T('Dejarlo descansar flotando con el tubo hasta que despierte.', 'Deixar-lo descansar flotant amb el tub fins que es desperte.'),
          why: T('En la fase postcrítica está inconsciente y puede vomitar: fuera del agua y en PLS.', 'En la fase postcrítica està inconscient i pot vomitar: fora de l\'aigua i en PLS.') }
      ] }
  ],
  pa: [
    { t: T('Comprueba consciencia y respiración: inconsciente pero respira. Retira cuerpos extraños visibles de la boca (sin barrido a ciegas) y colócalo en posición lateral de seguridad.',
           'Comprova consciència i respiració: inconscient però respira. Retira cossos estranys visibles de la boca (sense escombratge a cegues) i col·loca\'l en posició lateral de seguretat.'),
      why: T('Inconsciente que respira = PLS, con vía aérea permeable. Tras una crisis en el agua, el riesgo principal es la aspiración.',
             'Inconscient que respira = PLS, amb via aèria permeable. Després d\'una crisi en l\'aigua, el risc principal és l\'aspiració.'),
      ref: 'U11 PLS · RFESS cap. 9',
      alts: [
        { crit: true, t: T('Echarle agua fría en la cara para que despierte.', 'Tirar-li aigua freda a la cara perquè es desperte.'),
          why: T('Inconsciente con la vía aérea comprometida: el agua en la cara favorece la aspiración.', 'Inconscient amb la via aèria compromesa: l\'aigua a la cara afavorix l\'aspiració.') },
        { t: T('Dejarlo boca arriba y vigilarlo desde la silla.', 'Deixar-lo boca amunt i vigilar-lo des de la cadira.'),
          why: T('Boca arriba e inconsciente puede aspirar el vómito; y no se le deja solo.', 'Boca amunt i inconscient pot aspirar el vòmit; i no se\'l deixa sol.') }
      ] },
    { t: T('Protege la cabeza sin flexionarla, afloja lo que apriete, evita la luz directa en los ojos y no lo dejes solo: puede repetir la crisis. Abrígalo.',
           'Protegix el cap sense flexionar-lo, afluixa el que apete, evita la llum directa en els ulls i no el deixes sol: pot repetir la crisi. Abriga\'l.'),
      why: T('Protocolo tras la crisis: vía aérea, protección, nunca solo (crisis de repetición), evitar luz directa y pérdida de calor.',
             'Protocol després de la crisi: via aèria, protecció, mai sol (crisi de repetició), evitar llum directa i pèrdua de calor.'),
      ref: 'RFESS cap. 9',
      alts: [
        { t: T('Dejar que sus amigos se lo lleven a casa en cuanto abra los ojos.', 'Deixar que els seus amics se l\'emporten a casa tan prompte com òbriga els ulls.'),
          why: T('La fase postcrítica dura más de 5 minutos con confusión y amnesia; además ha estado con la cara en el agua: evaluación sanitaria.', 'La fase postcrítica dura més de 5 minuts amb confusió i amnèsia; a més ha estat amb la cara en l\'aigua: avaluació sanitària.') }
      ] },
    { t: T('Vigila la respiración y reevalúa constantes hasta el SVA; informa de la duración de la crisis y de que tuvo la cara en el agua (riesgo de ahogamiento retardado, vigilancia 24 h).',
           'Vigila la respiració i reavalua constants fins al SVA; informa de la duració de la crisi i que va tindre la cara en l\'aigua (risc d\'ofegament retardat, vigilància 24 h).'),
      why: T('Si ha inhalado agua puede aparecer distrés respiratorio horas después: tos persistente, somnolencia o cambios de comportamiento obligan a evaluación.',
             'Si ha inhalat aigua pot aparéixer distrés respiratori hores després: tos persistent, somnolència o canvis de comportament obliguen a avaluació.'),
      ref: 'U18.9 Normas tras un rescate',
      alts: [
        { crit: true, t: T('Darle azúcar o agua en cuanto empiece a reaccionar.', 'Donar-li sucre o aigua tan prompte com comence a reaccionar.'),
          why: T('Mientras no esté plenamente consciente, nada por boca.', 'Mentre no estiga plenament conscient, res per boca.') }
      ] }
  ]
},

/* ---------------------------------------------------------------- 4 */
{
  id: 'pla-ahog2', env: 'playa', sit: 'ahogamiento',
  title: T('Corriente de retorno: ahogamiento grado 2', 'Corrent de retorn: ofegament grau 2'),
  victim: T('Mujer de 30 años, consciente', 'Dona de 30 anys, conscient'),
  scene: T('Playa con bandera amarilla, 12:40, viento de levante. Una mujer a 40 m de la orilla está vertical, con la cabeza echada atrás y la boca a ras de agua, braceando sin avanzar; la corriente de retorno la aleja. No grita. Tienes tubo de rescate y aletas; tu compañero está en el puesto con la emisora.',
            'Platja amb bandera groga, 12:40, vent de llevant. Una dona a 40 m de la vora està vertical, amb el cap tirat arrere i la boca arran d\'aigua, bracejant sense avançar; el corrent de retorn l\'allunya. No crida. Tens tub de rescat i aletes; el teu company està en el lloc amb l\'emissora.'),
  scenePA: T('Acabas de sacar a la arena seca a una mujer de 30 años arrastrada por una corriente de retorno. Está consciente pero desorientada, respira con dificultad y ruidos, y tose expulsando espuma. Tu compañero está contigo con el botiquín y la emisora.',
              'Acabes de traure a l\'arena seca una dona de 30 anys arrossegada per un corrent de retorn. Està conscient però desorientada, respira amb dificultat i sorolls, i tus expulsant escuma. El teu company està amb tu amb la farmaciola i l\'emissora.'),
  rescue: [
    { t: T('Reconoces la Respuesta Instintiva al Ahogamiento (vertical, cabeza atrás, sin desplazamiento, no grita): señal de rescate en marcha y aviso por emisora; coges tubo y aletas.',
           'Reconeixes la Resposta Instintiva a l\'Ofegament (vertical, cap arrere, sense desplaçament, no crida): senyal de rescat en marxa i avís per emissora; agafes tub i aletes.'),
      why: T('Factor RID: reconocer la RIA es lo que hace posible actuar a tiempo; la víctima activa no puede pedir ayuda.',
             'Factor RID: reconéixer la RIA és el que fa possible actuar a temps; la víctima activa no pot demanar ajuda.'),
      ref: 'Tema 3.1 RID y RIA',
      alts: [
        { t: T('Seguir observando: como no grita, probablemente está descansando.', 'Continuar observant: com que no crida, probablement està descansant.'),
          why: T('El ahogamiento es silencioso: justo esos signos son la alerta.', 'L\'ofegament és silenciós: justament eixos signes són l\'alerta.') },
        { t: T('Correr al agua sin material para no perder tiempo.', 'Córrer a l\'aigua sense material per a no perdre temps.'),
          why: T('Una víctima en pánico te agarra: el tubo es tu seguridad y su flotación.', 'Una víctima en pànic t\'agafa: el tub és la teua seguretat i la seua flotació.') }
      ] },
    { t: T('Entra corriendo hasta que cubra, ponte las aletas y nada con la cabeza fuera; aprovecha la corriente de retorno para salir en lugar de luchar contra ella.',
           'Entra corrent fins que cobrisca, posa\'t les aletes i neda amb el cap fora; aprofita el corrent de retorn per a eixir en lloc de lluitar contra ell.'),
      why: T('Las aletas dan propulsión; la corriente te lleva hacia la víctima. Nadar contra ella agota.',
             'Les aletes donen propulsió; el corrent et porta cap a la víctima. Nedar contra ell esgota.'),
      ref: 'Salvamento C3 · Tema 1.2 material de apoyo',
      alts: [
        { t: T('Nadar en línea recta contra la corriente a máxima velocidad.', 'Nedar en línia recta contra el corrent a màxima velocitat.'),
          why: T('Te agotas antes de llegar; la corriente de retorno se usa a favor y se sale de ella en diagonal.', 'T\'esgotes abans d\'arribar; el corrent de retorn s\'usa a favor i se n\'ix en diagonal.') },
        { crit: true, t: T('Lanzarte de cabeza desde la orilla en la rompiente.', 'Llançar-te de cap des de la vora en el trencant.'),
          why: T('Zambullida en aguas poco profundas: el mecanismo clásico de lesión medular.', 'Capbussada en aigües poc profundes: el mecanisme clàssic de lesió medul·lar.') }
      ] },
    { t: T('Aproxímate con la cabeza fuera y ofrécele el tubo por delante; gana su espalda. Si no es capaz de agarrarlo, acércate por detrás y colócaselo tú.',
           'Aproxima\'t amb el cap fora i oferix-li el tub per davant; guanya la seua esquena. Si no és capaç d\'agafar-lo, acosta\'t per darrere i col·loca-li\'l tu.'),
      why: T('Técnica universal con víctima consciente: material por delante para evitar el agarre y las zafaduras.',
             'Tècnica universal amb víctima conscient: material per davant per a evitar l\'agafada i les zafadures.'),
      ref: 'Salvamento C6 y C7',
      alts: [
        { crit: true, t: T('Acercarte de frente cuerpo a cuerpo para sujetarla.', 'Acostar-te de front cos a cos per a subjectar-la.'),
          why: T('Agarre de pánico: te hunde y tendrías que hacer zafaduras. Nunca sin material interpuesto.', 'Agafada de pànic: t\'enfonsa i hauries de fer zafadures. Mai sense material interposat.') },
        { t: T('Esperar a distancia a que se agote para acercarte sin riesgo.', 'Esperar a distància que s\'esgote per a acostar-te sense risc.'),
          why: T('Puede sumergirse en cualquier momento; con el tubo puedes intervenir ya.', 'Pot submergir-se en qualsevol moment; amb el tub pots intervindre ja.') }
      ] },
    { t: T('Remolca con el tubo saliendo de la corriente en paralelo a la playa y vuelve por una zona segura, con sus vías aéreas fuera del agua.',
           'Remolca amb el tub eixint del corrent en paral·lel a la platja i torna per una zona segura, amb les seues vies aèries fora de l\'aigua.'),
      why: T('Se sale de la corriente de retorno lateralmente; después se vuelve por donde rompe suave.',
             'S\'ix del corrent de retorn lateralment; després es torna per on trenca suau.'),
      ref: 'Salvamento C7',
      alts: [
        { t: T('Remolcar directo hacia la orilla contra la corriente.', 'Remolcar directe cap a la vora contra el corrent.'),
          why: T('Agotamiento y sin avance; sal de la corriente en paralelo.', 'Esgotament i sense avanç; ix del corrent en paral·lel.') }
      ] },
    { t: T('Extracción cargándola a la espalda (sus axilas sobre tus hombros) hasta la arena seca, fuera del alcance de las olas.',
           'Extracció carregant-la a l\'esquena (les seues aixelles sobre els teus muscles) fins a l\'arena seca, fora de l\'abast de les ones.'),
      why: T('La carga a la espalda es la técnica más usada en playa y rampa; la valoración se hace lejos del agua.',
             'La càrrega a l\'esquena és la tècnica més usada en platja i rampa; la valoració es fa lluny de l\'aigua.'),
      ref: 'Salvamento C8 Playa/rampa',
      alts: [
        { t: T('Dejarla sentada en la orilla, donde rompen las olas, para que respire.', 'Deixar-la asseguda en la vora, on trenquen les ones, perquè respire.'),
          why: T('Las olas la vuelven a tumbar y la enfrían: fuera del agua, arena seca.', 'Les ones la tornen a gitar i la refreden: fora de l\'aigua, arena seca.') }
      ] }
  ],
  pa: [
    { t: T('Valoración: consciente pero desorientada, respira con dificultad, ruidos respiratorios y tos con espuma → ahogamiento de grado 2.',
           'Valoració: conscient però desorientada, respira amb dificultat, sorolls respiratoris i tos amb escuma → ofegament de grau 2.'),
      why: T('Grado 0 colabora sin tos; grado 1 respira con tos leve y colabora; grado 2 ruidos, tos con espuma y desorientación; grado 3 no respira con pulso; grado 4 ni respira ni pulso.',
             'Grau 0 col·labora sense tos; grau 1 respira amb tos lleu i col·labora; grau 2 sorolls, tos amb escuma i desorientació; grau 3 no respira amb pols; grau 4 ni respira ni pols.'),
      ref: 'U18.6 Grados de ahogamiento',
      alts: [
        { t: T('Es un grado 1: sentada y abrigada, no hace falta avisar.', 'És un grau 1: asseguda i abrigada, no cal avisar.'),
          why: T('Desorientación y espuma indican grado 2: avisar al 112.', 'Desorientació i escuma indiquen grau 2: avisar el 112.') },
        { crit: true, t: T('Es un grado 3: empiezo con 5 insuflaciones.', 'És un grau 3: comence amb 5 insuflacions.'),
          why: T('Respira y está consciente: ventilarla es agredirla y provocarle el vómito.', 'Respira i està conscient: ventilar-la és agredir-la i provocar-li el vòmit.') }
      ] },
    { t: T('Que tu compañero avise al 112 y colócala en posición lateral de seguridad, preferiblemente sobre el lado derecho; favorece la tos.',
           'Que el teu company avise el 112 i col·loca-la en posició lateral de seguretat, preferiblement sobre el costat dret; afavorix la tos.'),
      why: T('Grado 2: 112, PLS derecha, permitir y favorecer la tos, reevaluación constante.',
             'Grau 2: 112, PLS dreta, permetre i afavorir la tos, reavaluació constant.'),
      ref: 'U18.6',
      alts: [
        { t: T('Tumbarla boca arriba para que descanse.', 'Gitar-la boca amunt perquè descanse.'),
          why: T('Boca arriba con espuma y desorientación: riesgo de aspiración. PLS derecha.', 'Boca amunt amb escuma i desorientació: risc d\'aspiració. PLS dreta.') },
        { t: T('Pedirle que aguante la tos para que se calme.', 'Demanar-li que aguante la tos perquè es calme.'),
          why: T('La tos ayuda a expulsar líquido: se permite y se favorece.', 'La tos ajuda a expulsar líquid: es permet i s\'afavorix.') }
      ] },
    { t: T('No la dejes sola: reevalúa respiración y consciencia de forma continua y abrígala con manta térmica (sale mojada; la hipotermia llega en minutos).',
           'No la deixes sola: reavalua respiració i consciència de forma contínua i abriga-la amb manta tèrmica (ix mullada; la hipotèrmia arriba en minuts).'),
      why: T('Un grado 2 puede evolucionar a grado 3. En el medio acuático la E es más urgente que en tierra.',
             'Un grau 2 pot evolucionar a grau 3. En el medi aquàtic la E és més urgent que en terra.'),
      ref: 'U18 · corrección 28-09',
      alts: [
        { t: T('Darle agua para que se le pase la tos.', 'Donar-li aigua perquè se li passe la tos.'),
          why: T('Nada por boca con vía aérea comprometida y desorientación.', 'Res per boca amb via aèria compromesa i desorientació.') },
        { t: T('Volver a la silla de vigilancia y mirarla de vez en cuando.', 'Tornar a la cadira de vigilància i mirar-la de tant en tant.'),
          why: T('No se deja sola a la víctima; otro compañero cubre la vigilancia.', 'No es deixa sola la víctima; un altre company cobrix la vigilància.') }
      ] },
    { t: T('Transfiere al SVA con la información del rescate (corriente, tiempo, tos con espuma). Si rechazara el traslado, explica la vigilancia 24 h: tos persistente, somnolencia, amnesia o cambios de comportamiento → 112.',
           'Transferix al SVA amb la informació del rescat (corrent, temps, tos amb escuma). Si rebutjara el trasllat, explica la vigilància 24 h: tos persistent, somnolència, amnèsia o canvis de comportament → 112.'),
      why: T('Si ha entrado agua en las vías aéreas, el seguimiento es de 24 horas (ahogamiento retardado). Registra la asistencia en el libro de control.',
             'Si ha entrat aigua en les vies aèries, el seguiment és de 24 hores (ofegament retardat). Registra l\'assistència en el llibre de control.'),
      ref: 'U18.9 · Tema 1.1.2 libro de control',
      alts: [
        { t: T('Darle el alta en el puesto porque ya respira bien.', 'Donar-li l\'alta en el lloc perquè ja respira bé.'),
          why: T('Grado 2 implica aviso al 112 y evaluación sanitaria; el alta no es decisión del socorrista.', 'Grau 2 implica avís al 112 i avaluació sanitària; l\'alta no és decisió del socorrista.') }
      ] }
  ],
  notes: [T('Oxígeno: el temario del curso desaconseja su uso como fármaco en primeros auxilios, mientras la RFESS considera vital la alta concentración en el ahogado. Si el servicio dispone de O₂ y protocolo, el dispositivo para quien respira con hipoxemia grave es la mascarilla con reservorio a 10-15 L/min.',
            'Oxigen: el temari del curs desaconsella el seu ús com a fàrmac en primers auxilis, mentre la RFESS considera vital l\'alta concentració en l\'ofegat. Si el servei disposa d\'O₂ i protocol, el dispositiu per a qui respira amb hipoxèmia greu és la mascareta amb reservori a 10-15 L/min.')]
},

/* ---------------------------------------------------------------- 5 */
{
  id: 'pla-medusa', env: 'playa', sit: 'medusa',
  title: T('Picadura de medusa en una niña', 'Picada de medusa en una xiqueta'),
  victim: T('Niña de 8 años, consciente', 'Xiqueta de 8 anys, conscient'),
  scene: T('Playa, 11:00, bandera verde. Una madre llega al puesto con su hija llorando: tiene marcas rojas lineales en el antebrazo y el muslo, con restos gelatinosos pegados, tras rozar una medusa luminiscente. La madre quiere llevarla a la ducha de agua dulce para "limpiarla".',
            'Platja, 11:00, bandera verda. Una mare arriba al lloc amb la seua filla plorant: té marques roges lineals en l\'avantbraç i la cuixa, amb restes gelatinoses apegades, després de fregar una medusa luminiscent. La mare vol portar-la a la dutxa d\'aigua dolça per a "netejar-la".'),
  pa: [
    { t: T('Siéntala a la sombra con su madre, ponte guantes y háblale a su altura explicando lo que vas a hacer; pide a la madre que no la lleve a la ducha.',
           'Asseu-la a l\'ombra amb sa mare, posa\'t guants i parla-li a la seua altura explicant el que faràs; demana a la mare que no la porte a la dutxa.'),
      why: T('Con niños: tutor presente, hablar directamente al niño, a su altura, anticipar siempre lo que se va a hacer. Guantes: los restos urticantes también te pican a ti.',
             'Amb xiquets: tutor present, parlar directament al xiquet, a la seua altura, anticipar sempre el que es farà. Guants: les restes urticants també et piquen a tu.'),
      ref: 'U28 Diversidad funcional · U26',
      alts: [
        { crit: true, t: T('Dejar que la madre la enjuague en la ducha de agua dulce.', 'Deixar que la mare l\'esbandisca en la dutxa d\'aigua dolça.'),
          why: T('El agua dulce rompe los nematocistos que quedan en la piel y libera más veneno.', 'L\'aigua dolça trenca els nematocists que queden en la pell i allibera més verí.') },
        { crit: true, t: T('Frotar la zona con arena para arrastrar los restos.', 'Fregar la zona amb arena per a arrossegar les restes.'),
          why: T('Frotar o rascar descarga más células urticantes. Ni arena ni frotar.', 'Fregar o rascar descarrega més cèl·lules urticants. Ni arena ni fregar.') }
      ] },
    { t: T('Lava la zona con agua de mar o suero fisiológico sin restregar, y pide a la niña que no se rasque.',
           'Llava la zona amb aigua de mar o sèrum fisiològic sense refregar, i demana a la xiqueta que no es rasque.'),
      why: T('Lavar con agua de mar o suero, sin frotar; nunca agua dulce.',
             'Llavar amb aigua de mar o sèrum, sense fregar; mai aigua dolça.'),
      ref: 'U26.3.3 Medusas',
      alts: [
        { crit: true, t: T('Lavar con agua de la botella.', 'Llavar amb aigua de la botella.'),
          why: T('Agua dulce: libera más veneno de los restos adheridos.', 'Aigua dolça: allibera més verí de les restes adherides.') },
        { t: T('Aplicar orina sobre la picadura.', 'Aplicar orina sobre la picada.'),
          why: T('Un mito sin base en el temario: agua de mar o suero fisiológico.', 'Un mite sense base en el temari: aigua de mar o sèrum fisiològic.') }
      ] },
    { t: T('Retira los restos de tentáculos con pinzas o ayudándote de cinta adhesiva, sin tocarlos con los dedos.',
           'Retira les restes de tentacles amb pinces o ajudant-te de cinta adhesiva, sense tocar-los amb els dits.'),
      why: T('Los nematocistos siguen activos: pinzas o cinta adhesiva, con guantes.',
             'Els nematocists continuen actius: pinces o cinta adhesiva, amb guants.'),
      ref: 'U26.3.3',
      alts: [
        { t: T('Quitar los restos con los dedos de la mano enguantada, apretando.', 'Llevar les restes amb els dits de la mà enguantada, prement.'),
          why: T('Apretar descarga más veneno; pinzas o cinta adhesiva.', 'Prémer descarrega més verí; pinces o cinta adhesiva.') }
      ] },
    { t: T('Compresas impregnadas en vinagre o amoniaco diluido al 50 % durante 15 minutos, frías si es posible.',
           'Compreses impregnades en vinagre o amoníac diluït al 50 % durant 15 minuts, fredes si és possible.'),
      why: T('Vinagre o amoniaco diluido 15 minutos alivian dolor, escozor e inflamación.',
             'Vinagre o amoníac diluït 15 minuts alleugen dolor, coïssor i inflamació.'),
      ref: 'U26.3.3',
      alts: [
        { crit: true, t: T('Compresas de agua dulce bien fría.', 'Compreses d\'aigua dolça ben freda.'),
          why: T('Agua dulce, aunque esté fría: más veneno.', 'Aigua dolça, encara que estiga freda: més verí.') },
        { t: T('Alcohol de 96° sobre la zona.', 'Alcohol de 96° sobre la zona.'),
          why: T('No forma parte de la actuación: vinagre o amoniaco diluido.', 'No forma part de l\'actuació: vinagre o amoníac diluït.') }
      ] },
    { t: T('Frío indirecto: bolsa de hielo hermética sobre la zona durante 15 minutos; nunca cubitos directos.',
           'Fred indirecte: bossa de gel hermètica sobre la zona durant 15 minuts; mai glaçons directes.'),
      why: T('Hielo en bolsa hermética, de forma indirecta. Excepción: carabela portuguesa → calor, no frío.',
             'Gel en bossa hermètica, de forma indirecta. Excepció: caravel·la portuguesa → calor, no fred.'),
      ref: 'U26.3.3',
      alts: [
        { t: T('Cubitos de hielo directamente sobre la piel.', 'Glaçons directament sobre la pell.'),
          why: T('El hielo directo lesiona la piel y aporta agua dulce al fundirse.', 'El gel directe lesiona la pell i aporta aigua dolça en fondre\'s.') },
        { t: T('Compresas calientes.', 'Compreses calentes.'),
          why: T('El calor es para carabela portuguesa y picaduras de peces (toxinas termolábiles); con medusa, frío indirecto.', 'La calor és per a caravel·la portuguesa i picades de peixos (toxines termolàbils); amb medusa, fred indirecte.') }
      ] },
    { t: T('Desinfecta la zona, registra la asistencia y vigila síntomas generales: náuseas, vómitos, calambres, mareo o pérdida de consciencia.',
           'Desinfecta la zona, registra l\'assistència i vigila símptomes generals: nàusees, vòmits, rampes, mareig o pèrdua de consciència.'),
      why: T('La sintomatología general es rara pero posible; el dolor intenso puede provocar por sí mismo una pérdida de consciencia.',
             'La simptomatologia general és rara però possible; el dolor intens pot provocar per si mateix una pèrdua de consciència.'),
      ref: 'U26.3.3 · Tema 1.1.2',
      alts: [
        { t: T('Darle un antihistamínico del botiquín.', 'Donar-li un antihistamínic de la farmaciola.'),
          why: T('La presencia de fármacos no autoriza al socorrista a administrarlos.', 'La presència de fàrmacs no autoritza el socorrista a administrar-los.') }
      ] },
    { t: T('Deriva a un centro sanitario si aparecen síntomas generales o si la picadura afecta a cara o cuello (riesgo de asfixia); si no, alta con indicaciones a la madre.',
           'Deriva a un centre sanitari si apareixen símptomes generals o si la picada afecta cara o coll (risc d\'asfíxia); si no, alta amb indicacions a la mare.'),
      why: T('Criterios de derivación del temario: síntomas generales o picadura en cara/cuello.',
             'Criteris de derivació del temari: símptomes generals o picada en cara/coll.'),
      ref: 'U26.3.3',
      alts: [
        { t: T('Alta directa sin explicar nada: ya no llora.', 'Alta directa sense explicar res: ja no plora.'),
          why: T('Hay que indicar los signos de alarma y recomendar evitar el baño mientras haya medusas.', 'Cal indicar els signes d\'alarma i recomanar evitar el bany mentre hi haja meduses.') }
      ] }
  ],
  notes: [T('Prevención: evitar nadar con medusas, evitar los rompientes (llegan fragmentos urticantes), ropa de protección y crema solar. Carabela portuguesa: picadura peligrosa, se aplica calor.',
            'Prevenció: evitar nedar amb meduses, evitar els trencants (arriben fragments urticants), roba de protecció i crema solar. Caravel·la portuguesa: picada perillosa, s\'aplica calor.')]
},

/* ---------------------------------------------------------------- 6 */
{
  id: 'pla-calor', env: 'playa', sit: 'calor',
  title: T('Golpe de calor tras jugar al mediodía', 'Colp de calor després de jugar al migdia'),
  victim: T('Hombre de 58 años', 'Home de 58 anys'),
  scene: T('Playa, 14:30, 36 °C sin viento y humedad alta. Un hombre que llevaba una hora jugando a las palas se tambalea y se desploma en la arena. Está confuso, con la piel caliente, enrojecida y seca; respira rápido y el pulso es rápido. Su mujer dice que antes se quejaba de dolor de cabeza y náuseas y siguió jugando.',
            'Platja, 14:30, 36 °C sense vent i humitat alta. Un home que portava una hora jugant a les pales es tambaleja i es desploma en l\'arena. Està confús, amb la pell calenta, envermellida i seca; respira ràpid i el pols és ràpid. La seua dona diu que abans es queixava de mal de cap i nàusees i va continuar jugant.'),
  pa: [
    { t: T('Pide ayuda (señal), ponte guantes y llévalo con tu compañero a la sombra o al puesto, en reposo, en un lugar fresco y ventilado.',
           'Demana ajuda (senyal), posa\'t guants i porta\'l amb el teu company a l\'ombra o al lloc, en repòs, en un lloc fresc i ventilat.'),
      why: T('Primero sacarlo del sol: reposo, sombra, ambiente fresco y ventilado.',
             'Primer traure\'l del sol: repòs, ombra, ambient fresc i ventilat.'),
      ref: 'U24.2.3 Golpe de calor',
      alts: [
        { t: T('Dejarlo tumbado al sol mientras vas a por el botiquín.', 'Deixar-lo gitat al sol mentre vas a per la farmaciola.'),
          why: T('Cada minuto al sol sube más la temperatura central.', 'Cada minut al sol puja més la temperatura central.') },
        { crit: true, t: T('Pedir una cerveza bien fría al chiringuito para reanimarlo.', 'Demanar una cervesa ben freda al xiringuito per a reanimar-lo.'),
          why: T('Alcohol en un paciente confuso con riesgo de aspiración: nunca.', 'Alcohol en un pacient confús amb risc d\'aspiració: mai.') }
      ] },
    { t: T('ABCDE: vía aérea permeable, respiración rápida, pulso rápido, confuso (D), E: retira la ropa; la piel caliente y seca con confusión orienta a golpe de calor.',
           'ABCDE: via aèria permeable, respiració ràpida, pols ràpid, confús (D), E: retira la roba; la pell calenta i seca amb confusió orienta a colp de calor.'),
      why: T('Golpe de calor: fracaso de la termorregulación (>40 °C) con piel enrojecida y seca, hipotensión, taquicardia, confusión; puede llegar a convulsiones y coma.',
             'Colp de calor: fracàs de la termoregulació (>40 °C) amb pell envermellida i seca, hipotensió, taquicàrdia, confusió; pot arribar a convulsions i coma.'),
      ref: 'U24.2.3 · U11',
      alts: [
        { crit: true, t: T('Abrigarlo con la manta térmica porque está en shock.', 'Abrigar-lo amb la manta tèrmica perquè està en xoc.'),
          why: T('Retiene calor en alguien que ya no puede disiparlo.', 'Reté calor en algú que ja no pot dissipar-la.') },
        { t: T('Es una insolación: paños húmedos y a casa.', 'És una insolació: draps humits i a casa.'),
          why: T('La insolación cursa con piel sudorosa; piel seca y confusión es golpe de calor: emergencia.', 'La insolació cursa amb pell suada; pell seca i confusió és colp de calor: emergència.') }
      ] },
    { t: T('Avisa al 112: el golpe de calor es una emergencia (fracaso multiorgánico).',
           'Avisa el 112: el colp de calor és una emergència (fracàs multiorgànic).'),
      why: T('Por encima de 42 °C aparecen lesiones cerebrales irreversibles; precisa traslado urgente.',
             'Per damunt de 42 °C apareixen lesions cerebrals irreversibles; precisa trasllat urgent.'),
      ref: 'U24.2.3',
      alts: [
        { crit: true, t: T('Esperar media hora a ver si mejora a la sombra.', 'Esperar mitja hora a vore si millora a l\'ombra.'),
          why: T('El retraso multiplica el daño orgánico; se avisa ya.', 'El retard multiplica el dany orgànic; s\'avisa ja.') },
        { t: T('Avisar solo si convulsiona.', 'Avisar només si convulsiona.'),
          why: T('Confusión más piel seca ya es criterio de 112.', 'Confusió més pell seca ja és criteri de 112.') }
      ] },
    { t: T('Enfría: envuélvelo en una sábana húmeda, paños húmedos en frente, axilas e ingles, y favorece el movimiento de aire a su alrededor (abanicar).',
           'Refreda: embolica\'l en un llençol humit, draps humits en front, aixelles i engonals, i afavorix el moviment d\'aire al seu voltant (ventar).'),
      why: T('Actuación del temario: retirar ropa, sábana húmeda y facilitar la movilidad del aire.',
             'Actuació del temari: retirar roba, llençol humit i facilitar la mobilitat de l\'aire.'),
      ref: 'U24.2.3',
      alts: [
        { t: T('Darle paracetamol del botiquín para bajar la fiebre.', 'Donar-li paracetamol de la farmaciola per a baixar la febra.'),
          why: T('No es fiebre, es fracaso de la termorregulación: los antipiréticos no actúan y el socorrista no administra fármacos.', 'No és febra, és fracàs de la termoregulació: els antipirètics no actuen i el socorrista no administra fàrmacs.') },
        { t: T('Hielo directo por todo el cuerpo.', 'Gel directe per tot el cos.'),
          why: T('El temario indica sábana húmeda y aire; el hielo directo lesiona la piel.', 'El temari indica llençol humit i aire; el gel directe lesiona la pell.') }
      ] },
    { t: T('Líquidos solo si está consciente y colabora: agua a pequeños sorbos o bebida isotónica; si está confuso o somnoliento, nada por boca.',
           'Líquids només si està conscient i col·labora: aigua a xicotets glops o beguda isotònica; si està confús o somnolent, res per boca.'),
      why: T('Con alteración de la consciencia, el riesgo de aspiración manda.',
             'Amb alteració de la consciència, el risc d\'aspiració mana.'),
      ref: 'U24.2.3',
      alts: [
        { crit: true, t: T('Hacerle beber medio litro de agua aunque esté adormilado.', 'Fer-li beure mig litre d\'aigua encara que estiga endormiscat.'),
          why: T('Somnoliento: riesgo de aspiración. Nada por boca.', 'Somnolent: risc d\'aspiració. Res per boca.') },
        { t: T('Café bien cargado para espabilarlo.', 'Café ben carregat per a espavilar-lo.'),
          why: T('Las bebidas estimulantes no se dan; agua o isotónica a sorbos solo si colabora.', 'Les begudes estimulants no es donen; aigua o isotònica a glops només si col·labora.') }
      ] },
    { t: T('Controla constantes y nivel de consciencia hasta el SVA; si pierde la consciencia y respira, PLS; si convulsiona, protege la cabeza. Traslado urgente.',
           'Controla constants i nivell de consciència fins al SVA; si perd la consciència i respira, PLS; si convulsiona, protegix el cap. Trasllat urgent.'),
      why: T('Control de constantes y vía aérea permeable hasta la transferencia; puede evolucionar a estupor, convulsiones y coma.',
             'Control de constants i via aèria permeable fins a la transferència; pot evolucionar a estupor, convulsions i coma.'),
      ref: 'U24.2.3 · U21',
      alts: [
        { t: T('Sentarlo erguido si pierde la consciencia.', 'Asseure\'l dret si perd la consciència.'),
          why: T('Inconsciente que respira: PLS.', 'Inconscient que respira: PLS.') },
        { t: T('Dar por terminada la asistencia cuando la piel ya no quema.', 'Donar per acabada l\'assistència quan la pell ja no crema.'),
          why: T('El fracaso multiorgánico sigue aunque la piel se enfríe: vigilancia hasta el traslado.', 'El fracàs multiorgànic continua encara que la pell es refrede: vigilància fins al trasllat.') }
      ] }
  ],
  notes: [T('Insolación o agotamiento por calor: piel caliente y sudorosa, sed, cefalea, náuseas → sombra, reposo con cabeza elevada, paños húmedos y reposición de líquidos. Calambres por calor: lugar fresco y bebidas isotónicas.',
            'Insolació o esgotament per calor: pell calenta i suada, set, cefalea, nàusees → ombra, repòs amb cap elevat, draps humits i reposició de líquids. Rampes per calor: lloc fresc i begudes isotòniques.')]
},

/* ---------------------------------------------------------------- 7 */
{
  id: 'pla-lm-romp', env: 'playa', sit: 'medular', tags: ['ahogamiento', 'rcp'],
  title: T('Zambullida en la rompiente: inconsciente boca abajo', 'Capbussada en el trencant: inconscient boca avall'),
  victim: T('Joven de 22 años, inconsciente', 'Jove de 22 anys, inconscient'),
  scene: T('Playa con oleaje moderado, 18:00. Un joven se lanza de cabeza contra una ola en zona de 1 m y queda flotando boca abajo, inmóvil, zarandeado por las olas. Tienes tubo de rescate; tu compañero puede venir con tablero, collarín y el DESA.',
            'Platja amb onatge moderat, 18:00. Un jove es llança de cap contra una ona en zona d\'1 m i queda flotant boca avall, immòbil, sacsejat per les ones. Tens tub de rescat; el teu company pot vindre amb tauler, collarí i el DESA.'),
  scenePA: T('Tu compañero y tú acabáis de sacar a la arena seca a un joven que se tiró de cabeza contra una ola y quedó boca abajo. Está inconsciente, con arena en el pecho y los labios azulados. El DESA viene de camino.',
              'El teu company i tu acabeu de traure a l\'arena seca un jove que es va tirar de cap contra una ona i va quedar boca avall. Està inconscient, amb arena en el pit i els llavis blavosos. El DESA ve de camí.'),
  rescue: [
    { t: T('Señal de rescate en marcha y petición de material: tablero espinal, collarín, segundo socorrista y DESA; que se active el 112 ("zambullida, inconsciente").',
           'Senyal de rescat en marxa i petició de material: tauler espinal, collarí, segon socorrista i DESA; que s\'active el 112 ("capbussada, inconscient").'),
      why: T('Mecanismo de lesión medular y víctima inconsciente: necesitarás inmovilización y posiblemente reanimación.',
             'Mecanisme de lesió medul·lar i víctima inconscient: necessitaràs immobilització i possiblement reanimació.'),
      ref: 'Salvamento C11 PAS LM',
      alts: [
        { t: T('Entrar sin avisar y pedir el material después.', 'Entrar sense avisar i demanar el material després.'),
          why: T('El material tarda en llegar: se pide con la señal.', 'El material tarda a arribar: es demana amb el senyal.') }
      ] },
    { t: T('Entra corriendo con el tubo hasta que cubra y nada hacia él; en la rompiente, nunca de cabeza.',
           'Entra corrent amb el tub fins que cobrisca i neda cap a ell; en el trencant, mai de cap.'),
      why: T('Fondo irregular y poco profundo: entrada de pie.',
             'Fons irregular i poc profund: entrada de peu.'),
      ref: 'Salvamento C3',
      alts: [
        { crit: true, t: T('Zambullida de cabeza para ganar tiempo.', 'Capbussada de cap per a guanyar temps.'),
          why: T('El mismo mecanismo que acaba de lesionar a la víctima.', 'El mateix mecanisme que acaba de lesionar la víctima.') }
      ] },
    { t: T('Control: todo inconsciente en el agua es lesión medular hasta que se demuestre lo contrario → gíralo con bíceps-tríceps y golpe de riñón manteniendo el eje, vías aéreas fuera del agua.',
           'Control: tot inconscient en l\'aigua és lesió medul·lar fins que es demostre el contrari → gira\'l amb bíceps-tríceps i colp de ronyó mantenint l\'eix, vies aèries fora de l\'aigua.'),
      why: T('En aguas abiertas con oleaje la RFESS propone bíceps-tríceps más golpe de riñón; la cabeza en posición neutra si es posible.',
             'En aigües obertes amb onatge la RFESS proposa bíceps-tríceps més colp de ronyó; el cap en posició neutra si és possible.'),
      ref: 'Salvamento C6 y C11 Aguas abiertas',
      alts: [
        { crit: true, t: T('Girarlo agarrándole la cabeza con una mano.', 'Girar-lo agafant-li el cap amb una mà.'),
          why: T('Rotación del cuello sin control del eje.', 'Rotació del coll sense control de l\'eix.') },
        { crit: true, t: T('Remolcarlo boca abajo hasta la orilla.', 'Remolcar-lo boca avall fins a la vora.'),
          why: T('Vías aéreas sumergidas todo el trayecto.', 'Vies aèries submergides tot el trajecte.') }
      ] },
    { t: T('Comprueba la respiración: no respira → la ventilación es prioritaria sobre la inmovilización: extracción inmediata con el compañero manteniendo la alineación lo mejor posible, sin esperar al tablero.',
           'Comprova la respiració: no respira → la ventilació és prioritària sobre la immobilització: extracció immediata amb el company mantenint l\'alineació el millor possible, sense esperar el tauler.'),
      why: T('RFESS: en el inconsciente con LM, si no se puede asegurar la ventilación, extracción inmediata del agua.',
             'RFESS: en l\'inconscient amb LM, si no es pot assegurar la ventilació, extracció immediata de l\'aigua.'),
      ref: 'RFESS cap. 11 LM inconsciente',
      alts: [
        { crit: true, t: T('Esperar en el agua a tener collarín y tablero antes de sacarlo.', 'Esperar en l\'aigua a tindre collarí i tauler abans de traure\'l.'),
          why: T('No respira: cada minuto sin ventilar es daño cerebral; la columna va después de la vida.', 'No respira: cada minut sense ventilar és dany cerebral; la columna va després de la vida.') },
        { t: T('Intentar las 5 insuflaciones entre las olas antes de moverlo.', 'Intentar les 5 insuflacions entre les ones abans de moure\'l.'),
          why: T('Con oleaje no se puede ventilar con eficacia; la orilla está cerca: extrae y ventila en seco.', 'Amb onatge no es pot ventilar amb eficàcia; la vora està prop: extrau i ventila en sec.') }
      ] },
    { t: T('Remolque corto y extracción con el compañero hasta la arena seca, en decúbito supino y alineado.',
           'Remolc curt i extracció amb el company fins a l\'arena seca, en decúbit supí i alineat.'),
      why: T('Fuera del alcance de las olas, sobre superficie firme para poder reanimar.',
             'Fora de l\'abast de les ones, sobre superfície ferma per a poder reanimar.'),
      ref: 'Salvamento C8',
      alts: [
        { t: T('Dejarlo en la orilla con las olas rompiendo y empezar ahí.', 'Deixar-lo en la vora amb les ones trencant i començar ací.'),
          why: T('Las olas te lo mueven y mojan el tórax: arena seca.', 'Les ones te\'l mouen i mullen el tòrax: arena seca.') }
      ] }
  ],
  pa: [
    { t: T('Comprueba la consciencia (no responde) y abre la vía aérea con tracción mandibular, sin mover el cuello (sospecha de lesión cervical); cánula orofaríngea si la tienes.',
           'Comprova la consciència (no respon) i obri la via aèria amb tracció mandibular, sense moure el coll (sospita de lesió cervical); cànula orofaríngia si la tens.'),
      why: T('Con sospecha de lesión cervical no se hace frente-mentón: subluxación o tracción mandibular; la cánula de Guedel es útil aquí.',
             'Amb sospita de lesió cervical no es fa front-mentó: subluxació o tracció mandibular; la cànula de Guedel és útil ací.'),
      ref: 'U15 · U16 · U19',
      alts: [
        { t: T('Maniobra frente-mentón con hiperextensión completa.', 'Maniobra front-mentó amb hiperextensió completa.'),
          why: T('Zambullida contra una ola: sospecha clara de lesión cervical, tracción mandibular.', 'Capbussada contra una ona: sospita clara de lesió cervical, tracció mandibular.') }
      ] },
    STEP.breathingCheck(),
    STEP.fiveBreaths(),
    STEP.confirm112(),
    STEP.cpr(),
    STEP.desaWet(true),
    { t: T('Continúa hasta relevo o recuperación; si recupera la respiración, mantenlo en decúbito supino con control cervical (no PLS), inmoviliza con collarín y tablero cuando llegue el material y abrígalo.',
           'Continua fins a relleu o recuperació; si recupera la respiració, manté\'l en decúbit supí amb control cervical (no PLS), immobilitza amb collarí i tauler quan arribe el material i abriga\'l.'),
      why: T('La PLS está contraindicada con sospecha de lesión medular; una vez respira, la inmovilización vuelve a ser prioritaria.',
             'La PLS està contraindicada amb sospita de lesió medul·lar; una vegada respira, la immobilització torna a ser prioritària.'),
      ref: 'U11 PLS · U19',
      alts: [
        { crit: true, t: T('Colocarlo en PLS en cuanto respire.', 'Col·locar-lo en PLS tan prompte com respire.'),
          why: T('Contraindicada ante sospecha de LM: decúbito supino con control cervical.', 'Contraindicada davant sospita de LM: decúbit supí amb control cervical.') },
        { t: T('Suspender a los 10 minutos.', 'Suspendre als 10 minuts.'),
          why: T('Ahogado con hipotermia: RCP prolongada hasta relevo, recuperación o agotamiento.', 'Ofegat amb hipotèrmia: RCP prolongada fins a relleu, recuperació o esgotament.') }
      ] }
  ]
},

/* ---------------------------------------------------------------- 8 */
{
  id: 'par-hemorragia', env: 'parque', sit: 'herida',
  title: T('Corte profundo con hemorragia abundante en el tobogán', 'Tall profund amb hemorràgia abundant en el tobogan'),
  victim: T('Hombre de 30 años, consciente', 'Home de 30 anys, conscient'),
  scene: T('Parque acuático, 16:00. En la piscina de llegada de un tobogán, un hombre se ha abierto el muslo con un borde roto de la fibra. Sangre rojo oscuro, flujo continuo y abundante; está pálido y asustado. Hay público agolpándose y más usuarios bajando por el tobogán. Tienes el botiquín del puesto con gasas, vendas, vendaje israelí y torniquete.',
            'Parc aquàtic, 16:00. En la piscina d\'arribada d\'un tobogan, un home s\'ha obert la cuixa amb una vora trencada de la fibra. Sang roig fosc, flux continu i abundant; està pàl·lid i espantat. Hi ha públic agrupant-se i més usuaris baixant pel tobogan. Tens la farmaciola del lloc amb gases, benes, embenat israelià i torniquet.'),
  pa: [
    { t: T('P de PAS: haz parar el tobogán y aparta al público; guantes; sácalo del agua con ayuda y túmbalo en una zona segura.',
           'P de PAS: fes parar el tobogan i aparta el públic; guants; trau-lo de l\'aigua amb ajuda i gita\'l en una zona segura.'),
      why: T('Proteger la escena evita nuevos accidentes (más usuarios cayendo encima); guantes por bioseguridad.',
             'Protegir l\'escena evita nous accidents (més usuaris caient damunt); guants per bioseguretat.'),
      ref: 'U11 PAS · U14',
      alts: [
        { t: T('Empezar a comprimir dentro del agua sin parar el tobogán.', 'Començar a comprimir dins de l\'aigua sense parar el tobogan.'),
          why: T('El siguiente usuario os cae encima; primero la escena.', 'El següent usuari vos cau damunt; primer l\'escena.') },
        { t: T('Pedirle que camine hasta la enfermería.', 'Demanar-li que camine fins a la infermeria.'),
          why: T('Caminar aumenta el sangrado y puede desmayarse: tumbado y comprimiendo.', 'Caminar augmenta el sagnat i pot desmaiar-se: gitat i comprimint.') }
      ] },
    { t: T('A de PAS: que el jefe de zona avise al 112 (hemorragia abundante en extremidad, varón adulto) y traiga el maletín de emergencias.',
           'A de PAS: que el cap de zona avise el 112 (hemorràgia abundant en extremitat, home adult) i porte el maletí d\'emergències.'),
      why: T('Las hemorragias graves son situaciones en las que la demora modifica el pronóstico: aviso precoz.',
             'Les hemorràgies greus són situacions en què la demora modifica el pronòstic: avís precoç.'),
      ref: 'U1 Cadena asistencial · U22',
      alts: [
        { t: T('Esperar a ver si cede antes de molestar al 112.', 'Esperar a vore si cedix abans de molestar el 112.'),
          why: T('Sangrado continuo y abundante con palidez: se avisa mientras compri­mes.', 'Sagnat continu i abundant amb pal·lidesa: s\'avisa mentre comprimixes.') }
      ] },
    { t: T('Compresión directa sobre la herida con gasas o apósito, firme y mantenida al menos 10 minutos, sin levantar para mirar.',
           'Compressió directa sobre la ferida amb gases o apòsit, ferma i mantinguda almenys 10 minuts, sense alçar per a mirar.'),
      why: T('Primera medida en toda hemorragia externa: presión directa ≥10 min sin retirar el apósito.',
             'Primera mesura en tota hemorràgia externa: pressió directa ≥10 min sense retirar l\'apòsit.'),
      ref: 'U22 Actuación escalonada · Tema 7.4',
      alts: [
        { t: T('Torniquete directamente, por encima de la herida.', 'Torniquet directament, per damunt de la ferida.'),
          why: T('Sangrado venoso continuo: primero compresión directa; el torniquete es para hemorragia masiva, amputación o si fallan las medidas previas.', 'Sagnat venós continu: primer compressió directa; el torniquet és per a hemorràgia massiva, amputació o si fallen les mesures prèvies.') },
        { t: T('Levantar la gasa cada minuto para ver si ha parado.', 'Alçar la gasa cada minut per a vore si ha parat.'),
          why: T('Arrastras el coágulo que se está formando: 10 minutos sin levantar.', 'Arrossegues el coàgul que s\'està formant: 10 minuts sense alçar.') },
        { crit: true, t: T('Lavar la herida con el chorro de la manguera antes de nada.', 'Llavar la ferida amb el raig de la mànega abans de res.'),
          why: T('Con hemorragia abundante lo primero es parar el sangrado; la limpieza viene después.', 'Amb hemorràgia abundant el primer és parar el sagnat; la neteja ve després.') }
      ] },
    { t: T('Eleva la extremidad por encima del corazón mientras mantienes la compresión.',
           'Eleva l\'extremitat per damunt del cor mentre mantens la compressió.'),
      why: T('Segunda medida de la actuación escalonada: elevar la extremidad.',
             'Segona mesura de l\'actuació esglaonada: elevar l\'extremitat.'),
      ref: 'U22',
      alts: [
        { t: T('Sentarlo con la pierna colgando para que esté más cómodo.', 'Asseure\'l amb la cama penjant perquè estiga més còmode.'),
          why: T('La pierna por debajo del corazón sangra más; tumbado y elevada.', 'La cama per davall del cor sagna més; gitat i elevada.') }
      ] },
    { t: T('Si no cede: compresión sobre la arteria femoral (en la ingle) y vendaje compresivo o vendaje israelí sobre las gasas.',
           'Si no cedix: compressió sobre l\'artèria femoral (en l\'engonal) i embenat compressiu o embenat israelià sobre les gases.'),
      why: T('Tercera medida: compresión de la arteria que irriga la zona. El vendaje israelí combina compresa, banda elástica y barra de presión con una sola mano.',
             'Tercera mesura: compressió de l\'artèria que irriga la zona. L\'embenat israelià combina compresa, banda elàstica i barra de pressió amb una sola mà.'),
      ref: 'U22 · Tema 7.4.1 Vendaje israelí',
      alts: [
        { t: T('Retirar las gasas empapadas y poner otras limpias.', 'Retirar les gases amarades i posar-ne altres de netes.'),
          why: T('Se añaden gasas encima; retirarlas arranca el coágulo.', 'S\'afigen gases damunt; retirar-les arranca el coàgul.') }
      ] },
    { t: T('Solo si sigue sin ceder o la hemorragia es masiva: torniquete homologado 5-7 cm por encima de la herida, nunca sobre la rodilla, apretado hasta que pare (duele), anota la hora y no lo aflojes.',
           'Només si continua sense cedir o l\'hemorràgia és massiva: torniquet homologat 5-7 cm per damunt de la ferida, mai sobre el genoll, apretat fins que pare (fa mal), anota l\'hora i no l\'afluixes.'),
      why: T('Reglas del torniquete: 5-7 cm por encima, no sobre articulaciones ni objetos, un torniquete bien colocado duele, nunca aflojar; daño leve a partir de 2 h, grave a partir de 6 h.',
             'Regles del torniquet: 5-7 cm per damunt, no sobre articulacions ni objectes, un torniquet ben col·locat fa mal, mai afluixar; dany lleu a partir de 2 h, greu a partir de 6 h.'),
      ref: 'Tema 7.4.1 Torniquetes',
      alts: [
        { crit: true, t: T('Aflojar el torniquete cada 10 minutos para que llegue sangre a la pierna.', 'Afluixar el torniquet cada 10 minuts perquè arribe sang a la cama.'),
          why: T('Nunca se afloja: provoca una nueva hemorragia y shock.', 'Mai s\'afluixa: provoca una nova hemorràgia i xoc.') },
        { crit: true, t: T('Colocarlo justo sobre la rodilla, que es más fácil de apretar.', 'Col·locar-lo just sobre el genoll, que és més fàcil d\'apretar.'),
          why: T('Nunca sobre articulaciones: no comprime la arteria y lesiona.', 'Mai sobre articulacions: no comprimix l\'artèria i lesiona.') },
        { t: T('Aflojarlo un poco si dice que le duele.', 'Afluixar-lo un poc si diu que li fa mal.'),
          why: T('Un torniquete bien colocado duele; se mantiene.', 'Un torniquet ben col·locat fa mal; es manté.') }
      ] },
    { t: T('Vigila signos de shock (palidez, sudor frío, taquicardia, relleno capilar >2 s): posición antishock con piernas elevadas unos 30 cm, abrígalo y nada por boca.',
           'Vigila signes de xoc (pal·lidesa, suor freda, taquicàrdia, reompliment capil·lar >2 s): posició antixoc amb cames elevades uns 30 cm, abriga\'l i res per boca.'),
      why: T('Shock hemorrágico: tumbado boca arriba con piernas elevadas, manta térmica, aflojar ropa; nunca líquidos ni sólidos por vía oral.',
             'Xoc hemorràgic: gitat boca amunt amb cames elevades, manta tèrmica, afluixar roba; mai líquids ni sòlids per via oral.'),
      ref: 'U20 Shock',
      alts: [
        { crit: true, t: T('Darle agua con azúcar porque está pálido.', 'Donar-li aigua amb sucre perquè està pàl·lid.'),
          why: T('En shock, nunca nada por boca: vómito y aspiración.', 'En xoc, mai res per boca: vòmit i aspiració.') },
        { t: T('Sentarlo para que no se maree.', 'Asseure\'l perquè no es marege.'),
          why: T('Posición antishock: tumbado con piernas elevadas.', 'Posició antixoc: gitat amb cames elevades.') }
      ] },
    { t: T('Reevalúa constantes hasta el SVA, no retires ningún objeto clavado si lo hubiera, registra la asistencia (hora del torniquete incluida) y asegura el traslado.',
           'Reavalua constants fins al SVA, no retires cap objecte clavat si n\'hi haguera, registra l\'assistència (hora del torniquet inclosa) i assegura el trasllat.'),
      why: T('Nunca retirar cuerpos extraños clavados; el parte de asistencia acompaña al traslado.',
             'Mai retirar cossos estranys clavats; el comunicat d\'assistència acompanya el trasllat.'),
      ref: 'U22 · U23 · Tema 1.1.2',
      alts: [
        { t: T('Si ha parado, darle el alta con una tirita grande.', 'Si ha parat, donar-li l\'alta amb una tireta gran.'),
          why: T('Herida profunda con hemorragia abundante: valoración sanitaria y posible sutura.', 'Ferida profunda amb hemorràgia abundant: valoració sanitària i possible sutura.') }
      ] }
  ],
  notes: [T('Tipos de sangre: arterial (rojo brillante, a borbotones con el pulso), venosa (rojo oscuro, flujo continuo), capilar (en sábana). Más de 500 cc perdidos ya es hemorragia grave.',
            'Tipus de sang: arterial (roig brillant, a borbolls amb el pols), venosa (roig fosc, flux continu), capil·lar (en llençol). Més de 500 cc perduts ja és hemorràgia greu.')]
},

/* ---------------------------------------------------------------- 9 */
{
  id: 'par-ovace', env: 'parque', sit: 'ovace',
  title: T('Atragantamiento de un niño en la zona de picnic', 'Ennuegament d\'un xiquet en la zona de pícnic'),
  victim: T('Niño de 6 años', 'Xiquet de 6 anys'),
  scene: T('Parque acuático, zona de picnic, 13:15. Un niño que comía frutos secos empieza a toser con fuerza mientras su padre le da golpes en la espalda. Al llegar tú, el niño ya no puede toser ni hablar, se lleva las manos al cuello y sus labios empiezan a ponerse azules.',
            'Parc aquàtic, zona de pícnic, 13:15. Un xiquet que menjava fruita seca comença a tossir amb força mentre son pare li dona colps en l\'esquena. Quan arribes tu, el xiquet ja no pot tossir ni parlar, es porta les mans al coll i els seus llavis comencen a posar-se blaus.'),
  pa: [
    { t: T('Valora la gravedad: no tose, no habla, se agarra el cuello y hay cianosis → obstrucción completa. Pide que alguien avise al 112 mientras actúas.',
           'Valora la gravetat: no tus, no parla, s\'agafa el coll i hi ha cianosi → obstrucció completa. Demana que algú avise el 112 mentre actues.'),
      why: T('Parcial: tose, habla o llora → animar a toser sin golpear. Completa: no tose, no habla, no respira → actuar ya.',
             'Parcial: tus, parla o plora → animar a tossir sense colpejar. Completa: no tus, no parla, no respira → actuar ja.'),
      ref: 'U17 Signos y síntomas',
      alts: [
        { t: T('Animarle a toser más fuerte.', 'Animar-lo a tossir més fort.'),
          why: T('Ya no puede toser: es completa. Animar a toser es para la obstrucción parcial.', 'Ja no pot tossir: és completa. Animar a tossir és per a l\'obstrucció parcial.') },
        { crit: true, t: T('Meterle el dedo en la garganta a ciegas para sacar el fruto seco.', 'Ficar-li el dit en la gola a cegues per a traure la fruita seca.'),
          why: T('Nunca barrido a ciegas: empuja el objeto más adentro.', 'Mai escombratge a cegues: espenta l\'objecte més endins.') },
        { crit: true, t: T('Darle agua para que lo trague.', 'Donar-li aigua perquè l\'engolisca.'),
          why: T('Con la vía aérea obstruida, el agua agrava la obstrucción.', 'Amb la via aèria obstruïda, l\'aigua agreuja l\'obstrucció.') }
      ] },
    { t: T('Colócate a su lado, sujétale el pecho con una mano, inclínalo hacia delante y da 5 golpes interescapulares con el talón de la mano.',
           'Col·loca\'t al seu costat, subjecta-li el pit amb una mà, inclina\'l cap avant i dona 5 colps interescapulars amb el taló de la mà.'),
      why: T('Maniobra: lateral, sujetar pecho, reclinar hacia delante, 5 golpes entre los omóplatos.',
             'Maniobra: lateral, subjectar pit, reclinar cap avant, 5 colps entre els omòplats.'),
      ref: 'U17 Maniobra de Heimlich',
      alts: [
        { t: T('Golpes en la espalda con el niño erguido, como hacía el padre.', 'Colps en l\'esquena amb el xiquet dret, com feia el pare.'),
          why: T('Inclinado hacia delante para que la gravedad ayude a expulsar el objeto.', 'Inclinat cap avant perquè la gravetat ajude a expulsar l\'objecte.') },
        { t: T('Ponerlo boca abajo sobre el antebrazo.', 'Posar-lo boca avall sobre l\'avantbraç.'),
          why: T('Eso es para lactantes (<1 año). A los 6 años: golpes interescapulares y compresiones abdominales adaptadas a su altura.', 'Això és per a lactants (<1 any). Als 6 anys: colps interescapulars i compressions abdominals adaptades a la seua altura.') }
      ] },
    { t: T('Si no expulsa: 5 compresiones abdominales (Heimlich) adaptadas a su altura, puño sobre el ombligo por debajo de la apófisis xifoides, hacia dentro y arriba.',
           'Si no expulsa: 5 compressions abdominals (Heimlich) adaptades a la seua altura, puny sobre el melic per davall de l\'apòfisi xifoide, cap a dins i amunt.'),
      why: T('Niños de 1 a 8 años: Heimlich adaptado a su altura (arrodillado o sentado detrás).',
             'Xiquets d\'1 a 8 anys: Heimlich adaptat a la seua altura (agenollat o assegut darrere).'),
      ref: 'U17 Casos especiales',
      alts: [
        { t: T('Compresiones torácicas en el esternón en lugar de abdominales.', 'Compressions toràciques en l\'estern en lloc d\'abdominals.'),
          why: T('Las torácicas sustituyen al Heimlich en embarazadas, obesos y lactantes; en un niño de 6 años, abdominales.', 'Les toràciques substituïxen el Heimlich en embarassades, obesos i lactants; en un xiquet de 6 anys, abdominals.') },
        { t: T('Puño sobre el esternón.', 'Puny sobre l\'estern.'),
          why: T('El puño va entre el ombligo y la apófisis xifoides.', 'El puny va entre el melic i l\'apòfisi xifoide.') }
      ] },
    { t: T('Alterna ciclos de 5 golpes y 5 compresiones mientras siga consciente, revisando la boca entre ciclos por si el objeto es visible.',
           'Alterna cicles de 5 colps i 5 compressions mentre continue conscient, revisant la boca entre cicles per si l\'objecte és visible.'),
      why: T('Se repite el ciclo mientras la víctima esté consciente; solo se extrae el objeto si se ve.',
             'Es repetix el cicle mentre la víctima estiga conscient; només s\'extrau l\'objecte si es veu.'),
      ref: 'U17 Algoritmo OVACE',
      alts: [
        { crit: true, t: T('Sacudirlo cabeza abajo sujetándolo por los pies.', 'Sacsejar-lo cap avall subjectant-lo pels peus.'),
          why: T('Lesiones cervicales y traumatismos; no es ninguna maniobra del protocolo.', 'Lesions cervicals i traumatismes; no és cap maniobra del protocol.') }
      ] },
    { t: T('Si pierde la consciencia: túmbalo, confirma el 112 e inicia RCP pediátrica: abre la vía aérea (retira el objeto solo si lo ves), 5 insuflaciones iniciales y ciclos 30:2 (15:2 si sois dos).',
           'Si perd la consciència: gita\'l, confirma el 112 i inicia RCP pediàtrica: obri la via aèria (retira l\'objecte només si el veus), 5 insuflacions inicials i cicles 30:2 (15:2 si sou dos).'),
      why: T('Inconsciente → RCP inmediata. RCP infantil: 5 insuflaciones iniciales, 30:2 con un reanimador, 15:2 con dos.',
             'Inconscient → RCP immediata. RCP infantil: 5 insuflacions inicials, 30:2 amb un reanimador, 15:2 amb dos.'),
      ref: 'U17 · U15 RCP infantil',
      alts: [
        { t: T('Seguir con Heimlich en el suelo hasta que salga.', 'Continuar amb Heimlich en terra fins que isca.'),
          why: T('Inconsciente: las compresiones torácicas de la RCP sustituyen a las abdominales.', 'Inconscient: les compressions toràciques de l\'RCP substituïxen les abdominals.') },
        { crit: true, t: T('Colocarlo en PLS a esperar al SVA.', 'Col·locar-lo en PLS a esperar el SVA.'),
          why: T('No respira: PLS equivale a no hacer nada.', 'No respira: PLS equival a no fer res.') }
      ] },
    { t: T('Tras expulsar el objeto: tranquiliza al niño y al padre, reevalúa la respiración y deriva a valoración médica (las compresiones pueden causar lesiones internas); registra la asistencia.',
           'Després d\'expulsar l\'objecte: tranquil·litza el xiquet i el pare, reavalua la respiració i deriva a valoració mèdica (les compressions poden causar lesions internes); registra l\'assistència.'),
      why: T('Tras compresiones abdominales siempre valoración médica; el apoyo psicológico es parte de la actuación.',
             'Després de compressions abdominals sempre valoració mèdica; el suport psicològic és part de l\'actuació.'),
      ref: 'U17 · U3 Apoyo psicológico',
      alts: [
        { t: T('Dejar que siga comiendo frutos secos ya que está bien.', 'Deixar que continue menjant fruita seca ja que està bé.'),
          why: T('Valoración médica y evitar el alimento causante.', 'Valoració mèdica i evitar l\'aliment causant.') }
      ] }
  ],
  notes: [T('Lactante (<1 año): nunca Heimlich ni barridos; boca abajo sobre el antebrazo, 5 golpes interescapulares alternados con 5 compresiones torácicas con dos dedos. Embarazada u obeso: 5 compresiones torácicas en la zona media del esternón.',
            'Lactant (<1 any): mai Heimlich ni escombratges; boca avall sobre l\'avantbraç, 5 colps interescapulars alternats amb 5 compressions toràciques amb dos dits. Embarassada o obés: 5 compressions toràciques en la zona mitjana de l\'estern.')]
},

/* ---------------------------------------------------------------- 10 */
{
  id: 'par-pcr', env: 'parque', sit: 'rcp',
  title: T('Parada cardiorrespiratoria en la cola de una atracción', 'Parada cardiorespiratòria en la cua d\'una atracció'),
  victim: T('Mujer de 65 años', 'Dona de 65 anys'),
  scene: T('Parque acuático, 15:00, suelo mojado de la zona de colas. Una mujer se desploma sin previo aviso. No responde a estímulos y, al abrirle la vía aérea, no respira. Hay público, tu compañero está a 50 m con la emisora y el DESA está en la enfermería central (3 minutos).',
            'Parc aquàtic, 15:00, terra mullada de la zona de cues. Una dona es desploma sense previ avís. No respon a estímuls i, en obrir-li la via aèria, no respira. Hi ha públic, el teu company està a 50 m amb l\'emissora i el DESA està en la infermeria central (3 minuts).'),
  pa: [
    { t: T('Asegura la escena (aparta al público, pide espacio) y comprueba la consciencia: sacúdela por los hombros y pregúntale si está bien.',
           'Assegura l\'escena (aparta el públic, demana espai) i comprova la consciència: sacseja-la pels muscles i pregunta-li si està bé.'),
      why: T('Proteger y valorar la respuesta; si respondiera, PLS.',
             'Protegir i valorar la resposta; si responguera, PLS.'),
      ref: 'U15 Valoración inicial',
      alts: [
        { t: T('Empezar compresiones nada más llegar.', 'Començar compressions només arribar.'),
          why: T('Primero la secuencia: respuesta, vía aérea, respiración.', 'Primer la seqüència: resposta, via aèria, respiració.') }
      ] },
    { t: T('No responde: grita pidiendo ayuda, haz que tu compañero active el 112 y traiga el DESA ya (sin mecanismo de trauma: maniobra frente-mentón).',
           'No respon: crida demanant ajuda, fes que el teu company active el 112 i porte el DESA ja (sense mecanisme de trauma: maniobra front-mentó).'),
      why: T('Si no responde → gritar pidiendo ayuda y activar 112 y DESA; si estuvieras sola, activarías las emergencias antes de empezar la RCP (adulto, causa cardíaca).',
             'Si no respon → cridar demanant ajuda i activar 112 i DESA; si estigueres sola, activaries les emergències abans de començar l\'RCP (adult, causa cardíaca).'),
      ref: 'U15 Secuencia',
      alts: [
        { t: T('Abrir la vía aérea con tracción mandibular por si se ha golpeado al caer.', 'Obrir la via aèria amb tracció mandibular per si s\'ha colpejat en caure.'),
          why: T('Sin mecanismo de lesión cervical se usa frente-mentón; la tracción mandibular es para sospecha de trauma.', 'Sense mecanisme de lesió cervical s\'usa front-mentó; la tracció mandibular és per a sospita de trauma.') }
      ] },
    { t: T('VOS 10 segundos: no respira → inicia RCP 30:2 inmediatamente (en el adulto no acuático no hay 5 insuflaciones iniciales).',
           'VOS 10 segons: no respira → inicia RCP 30:2 immediatament (en l\'adult no aquàtic no hi ha 5 insuflacions inicials).'),
      why: T('Parada de origen cardíaco: 30 compresiones y 2 ventilaciones desde el principio. Las 5 insuflaciones iniciales son para el ahogado y el niño.',
             'Parada d\'origen cardíac: 30 compressions i 2 ventilacions des del principi. Les 5 insuflacions inicials són per a l\'ofegat i el xiquet.'),
      ref: 'U15 RCP básica · U18',
      alts: [
        { t: T('5 insuflaciones de rescate iniciales antes de comprimir.', '5 insuflacions de rescat inicials abans de comprimir.'),
          why: T('No es un ahogado ni un niño: 30:2 directo. Confundir los protocolos retrasa las compresiones.', 'No és un ofegat ni un xiquet: 30:2 directe. Confondre els protocols retarda les compressions.') },
        { crit: true, t: T('Colocarla en PLS y esperar al DESA.', 'Col·locar-la en PLS i esperar el DESA.'),
          why: T('No respira: sin compresiones no hay perfusión cerebral.', 'No respira: sense compressions no hi ha perfusió cerebral.') }
      ] },
    { t: T('Compresiones en el centro del pecho a 100-120 por minuto, 5-6 cm, brazos rectos, dejando que el tórax se expanda; ventilaciones de 1 segundo con mascarilla si la tienes.',
           'Compressions en el centre del pit a 100-120 per minut, 5-6 cm, braços rectes, deixant que el tòrax s\'expandisca; ventilacions d\'1 segon amb mascareta si la tens.'),
      why: T('Parámetros de calidad: frecuencia, profundidad, descompresión completa y mínimas interrupciones.',
             'Paràmetres de qualitat: freqüència, profunditat, descompressió completa i mínimes interrupcions.'),
      ref: 'U15',
      alts: [
        { t: T('Comprimir sobre el abdomen, donde cede mejor.', 'Comprimir sobre l\'abdomen, on cedix millor.'),
          why: T('Centro del pecho, mitad inferior del esternón.', 'Centre del pit, meitat inferior de l\'estern.') },
        { t: T('Ventilar con insuflaciones largas de 3 segundos.', 'Ventilar amb insuflacions llargues de 3 segons.'),
          why: T('1 segundo por insuflación, hasta ver elevación torácica.', '1 segon per insuflació, fins a vore elevació toràcica.') }
      ] },
    { t: T('Llega el DESA: mueve a la víctima a zona seca o seca el suelo, seca el tórax, parches bajo la clavícula derecha y bajo la axila izquierda; análisis, "todos fuera", descarga y RCP 2 minutos.',
           'Arriba el DESA: mou la víctima a zona seca o asseca el terra, asseca el tòrax, pegats davall la clavícula dreta i davall l\'aixella esquerra; anàlisi, "tots fora", descàrrega i RCP 2 minuts.'),
      why: T('Desfibrilación precoz en 3-5 minutos; no se descarga sobre suelo mojado.',
             'Desfibril·lació precoç en 3-5 minuts; no es descarrega sobre terra mullada.'),
      ref: 'U16 DESA',
      alts: [
        { crit: true, t: T('Descargar donde está, sobre el suelo encharcado.', 'Descarregar on està, sobre el terra entollat.'),
          why: T('Riesgo eléctrico para todos; zona seca.', 'Risc elèctric per a tots; zona seca.') },
        { t: T('Parches en esternón y espalda.', 'Pegats en estern i esquena.'),
          why: T('Anteroposterior es la posición pediátrica.', 'Anteroposterior és la posició pediàtrica.') }
      ] },
    { t: T('Continúa RCP y DESA, relevándote con tu compañero cada 2 minutos, hasta que recupere signos de vida, os releve el SVA o os agotéis.',
           'Continua RCP i DESA, rellevant-te amb el teu company cada 2 minuts, fins que recupere signes de vida, vos releve el SVA o vos esgoteu.'),
      why: T('Criterios para parar: recuperación, relevo por el equipo de reanimación avanzada o agotamiento.',
             'Criteris per a parar: recuperació, relleu per l\'equip de reanimació avançada o esgotament.'),
      ref: 'U15 Cuándo parar',
      alts: [
        { t: T('Parar al oír la sirena de la ambulancia.', 'Parar en sentir la sirena de l\'ambulància.'),
          why: T('Se continúa hasta que el equipo te releva físicamente.', 'Es continua fins que l\'equip et releva físicament.') }
      ] }
  ]
},

/* ---------------------------------------------------------------- 11 */
{
  id: 'agu-hipotermia', env: 'aguas', sit: 'hipotermia',
  title: T('Nadador de travesía con hipotermia en el pantano', 'Nadador de travessia amb hipotèrmia en el pantà'),
  victim: T('Hombre de 40 años, consciente', 'Home de 40 anys, conscient'),
  scene: T('Pantano, travesía de aguas abiertas en abril, agua a 14 °C y viento. Un nadador con neopreno fino lleva 40 minutos en el agua, se detiene a 60 m de la orilla, tirita con violencia, nada descoordinado y contesta de forma confusa a la embarcación de apoyo. Tienes boya torpedo y aletas; la embarcación está a 100 m.',
            'Pantà, travessia d\'aigües obertes a l\'abril, aigua a 14 °C i vent. Un nadador amb neopré fi porta 40 minuts en l\'aigua, es deté a 60 m de la vora, tremola amb violència, neda descoordinat i contesta de forma confusa a l\'embarcació de suport. Tens boia torpede i aletes; l\'embarcació està a 100 m.'),
  scenePA: T('Acabas de sacar por la rampa a un nadador de travesía que llevaba 40 minutos en agua a 14 °C. Tirita con violencia, está confuso y descoordinado, con la piel pálida y fría. Lleva neopreno fino empapado. Hace viento. En el vehículo del servicio hay mantas y calefacción.',
              'Acabes de traure per la rampa un nadador de travessia que portava 40 minuts en aigua a 14 °C. Tremola amb violència, està confús i descoordinat, amb la pell pàl·lida i freda. Porta neopré fi amerat. Fa vent. En el vehicle del servei hi ha mantes i calefacció.'),
  rescue: [
    { t: T('Señal de rescate en marcha y aviso por emisora a la embarcación y al coordinador: posible hipotermia, que preparen mantas y zona caliente, y activen el 112.',
           'Senyal de rescat en marxa i avís per emissora a l\'embarcació i al coordinador: possible hipotèrmia, que preparen mantes i zona calenta, i activen el 112.'),
      why: T('Confusión y descoordinación en agua fría son signos de hipotermia moderada: la cadena se activa antes de entrar.',
             'Confusió i descoordinació en aigua freda són signes d\'hipotèrmia moderada: la cadena s\'activa abans d\'entrar.'),
      ref: 'Tema 3.2 · U24.3.1',
      alts: [
        { t: T('Esperar a que la embarcación lo recoja sin intervenir.', 'Esperar que l\'embarcació el replegue sense intervindre.'),
          why: T('Puede sumergirse en cualquier momento; con material puedes llegar antes.', 'Pot submergir-se en qualsevol moment; amb material pots arribar abans.') }
      ] },
    { t: T('Entra con la boya torpedo y aletas (ideal en espacios naturales) y aproxímate con la cabeza fuera.',
           'Entra amb la boia torpede i aletes (ideal en espais naturals) i aproxima\'t amb el cap fora.'),
      why: T('La boya torpedo es rígida, de alta flotabilidad y pensada para espacios naturales; las aletas dan propulsión en distancias largas.',
             'La boia torpede és rígida, d\'alta flotabilitat i pensada per a espais naturals; les aletes donen propulsió en distàncies llargues.'),
      ref: 'Salvamento C2 · Tema 1.2',
      alts: [
        { t: T('Entrar sin material porque el nadador aún está consciente.', 'Entrar sense material perquè el nadador encara està conscient.'),
          why: T('Confuso y descoordinado puede entrar en pánico y agarrarte; material siempre.', 'Confús i descoordinat pot entrar en pànic i agafar-te; material sempre.') }
      ] },
    { t: T('Ofrécele la boya por delante, gana su espalda y asegúralo sobre el material; si no es capaz de agarrarse, colócaselo tú desde atrás.',
           'Oferix-li la boia per davant, guanya la seua esquena i assegura\'l sobre el material; si no és capaç d\'agafar-se, col·loca-li\'l tu des de darrere.'),
      why: T('Técnica universal; la boya no asegura por sí sola a un inconsciente, así que vigila que mantenga el agarre.',
             'Tècnica universal; la boia no assegura per si sola un inconscient, així que vigila que mantinga l\'agafada.'),
      ref: 'Salvamento C7',
      alts: [
        { crit: true, t: T('Agarrarlo de frente para que no se hunda.', 'Agafar-lo de front perquè no s\'enfonse.'),
          why: T('Agarre de pánico sin material interpuesto.', 'Agafada de pànic sense material interposat.') }
      ] },
    { t: T('Remolca hacia la orilla o hacia la embarcación (lo que sea más rápido), con sus vías aéreas fuera y vigilando que no pierda la consciencia.',
           'Remolca cap a la vora o cap a l\'embarcació (el que siga més ràpid), amb les seues vies aèries fora i vigilant que no perda la consciència.'),
      why: T('La hipotermia por inmersión se instaura rápido: cuanto menos tiempo en el agua, mejor.',
             'La hipotèrmia per immersió s\'instaura ràpid: com menys temps en l\'aigua, millor.'),
      ref: 'U24.3.1',
      alts: [
        { t: T('Remolcar siempre hasta la orilla aunque la embarcación esté al lado.', 'Remolcar sempre fins a la vora encara que l\'embarcació estiga al costat.'),
          why: T('Sal del agua por el punto más rápido y seguro.', 'Ix de l\'aigua pel punt més ràpid i segur.') }
      ] },
    { t: T('Extracción por la rampa cargándolo a la espalda, con cuidado y sin movimientos bruscos, hasta un lugar resguardado del viento.',
           'Extracció per la rampa carregant-lo a l\'esquena, amb compte i sense moviments bruscos, fins a un lloc resguardat del vent.'),
      why: T('Fuera del agua, lo primero es un ambiente sin corrientes de aire.',
             'Fora de l\'aigua, el primer és un ambient sense corrents d\'aire.'),
      ref: 'Salvamento C8 · U24.3.1',
      alts: [
        { t: T('Dejarlo de pie al aire para que escurra el neopreno.', 'Deixar-lo de peu a l\'aire perquè escorrega el neopré.'),
          why: T('El viento sobre ropa mojada acelera la pérdida de calor.', 'El vent sobre roba mullada accelera la pèrdua de calor.') }
      ] }
  ],
  pa: [
    { t: T('Valoración ABCDE: respiración lenta, pulso difícil de palpar (tómate hasta 1 minuto), consciente pero confuso, piel pálida y fría; hipotermia (<35 °C) con tiritona y confusión.',
           'Valoració ABCDE: respiració lenta, pols difícil de palpar (pren-te fins a 1 minut), conscient però confús, pell pàl·lida i freda; hipotèrmia (<35 °C) amb tremolor i confusió.'),
      why: T('La hipotermia enmascara los signos vitales; alrededor de 35 °C: tiritona y piel fría; por debajo: temblor fino, confusión, descoordinación.',
             'La hipotèrmia emmascara els signes vitals; al voltant de 35 °C: tremolor i pell freda; per davall: tremolor fi, confusió, descoordinació.'),
      ref: 'U24.3.1 · corrección 28-09',
      alts: [
        { t: T('Saltarte la valoración: está hablando.', 'Saltar-te la valoració: està parlant.'),
          why: T('Por debajo de 32 °C aparecen rigidez y disminución de consciencia; por debajo de 26 °C, parada. Se valora y se vigila.', 'Per davall de 32 °C apareixen rigidesa i disminució de consciència; per davall de 26 °C, parada. Es valora i es vigila.') }
      ] },
    { t: T('Confirma el 112 y trasládalo a un ambiente con temperatura superior a 32 °C y sin corrientes de aire (el vehículo con calefacción).',
           'Confirma el 112 i trasllada\'l a un ambient amb temperatura superior a 32 °C i sense corrents d\'aire (el vehicle amb calefacció).'),
      why: T('Primera norma de actuación: ambiente >32 °C libre de corrientes.',
             'Primera norma d\'actuació: ambient >32 °C lliure de corrents.'),
      ref: 'U24.3.1 Normas de actuación',
      alts: [
        { t: T('Dejarlo al sol en la rampa.', 'Deixar-lo al sol en la rampa.'),
          why: T('El viento sigue enfriándolo; necesita un ambiente cerrado y caliente.', 'El vent continua refredant-lo; necessita un ambient tancat i calent.') }
      ] },
    { t: T('Retira el neopreno y la ropa mojada, sécalo y cúbrelo con ropa seca incluida la cabeza; manta térmica con el dorado hacia fuera.',
           'Retira el neopré i la roba mullada, asseca\'l i cobrix-lo amb roba seca inclòs el cap; manta tèrmica amb el daurat cap a fora.'),
      why: T('Retirar ropa fría o mojada, abrigar cuerpo y cabeza, manta térmica dorado hacia fuera para conservar calor.',
             'Retirar roba freda o mullada, abrigar cos i cap, manta tèrmica daurat cap a fora per a conservar calor.'),
      ref: 'U24.3.1 · U13 Manta isotérmica',
      alts: [
        { t: T('Manta térmica con el lado plateado hacia fuera.', 'Manta tèrmica amb el costat platejat cap a fora.'),
          why: T('Dorado hacia fuera = conservar calor; plateado hacia fuera = reflejar calor (golpe de calor).', 'Daurat cap a fora = conservar calor; platejat cap a fora = reflectir calor (colp de calor).') },
        { t: T('Dejarle el neopreno puesto para que no coja frío al desnudarlo.', 'Deixar-li el neopré posat perquè no agafe fred en despullar-lo.'),
          why: T('La ropa mojada sigue robando calor: se retira y se seca.', 'La roba mullada continua robant calor: es retira i s\'asseca.') }
      ] },
    { t: T('Aporta calor corporal y, como está consciente y sin estupor, líquidos calientes azucarados a sorbos; nada de alcohol ni bebidas estimulantes.',
           'Aporta calor corporal i, com que està conscient i sense estupor, líquids calents ensucrats a glops; res d\'alcohol ni begudes estimulants.'),
      why: T('Líquidos calientes azucarados solo en pacientes sin estupor; evitar estimulantes y alcohol.',
             'Líquids calents ensucrats només en pacients sense estupor; evitar estimulants i alcohol.'),
      ref: 'U24.3.1',
      alts: [
        { crit: true, t: T('Un trago de coñac para entrar en calor.', 'Un glop de conyac per a entrar en calor.'),
          why: T('El alcohol vasodilata y acelera la pérdida de calor; además deprime la consciencia.', 'L\'alcohol vasodilata i accelera la pèrdua de calor; a més deprimix la consciència.') },
        { t: T('Frotarle las piernas enérgicamente para activar la circulación.', 'Fregar-li les cames enèrgicament per a activar la circulació.'),
          why: T('Las piernas se recalientan por encima de los valores normales; se aporta calor corporal, no fricción.', 'Les cames es reescalfen per damunt dels valors normals; s\'aporta calor corporal, no fricció.') }
      ] },
    { t: T('Vigila constantes y consciencia hasta el SVA; si entra en parada cardiorrespiratoria, RCP mantenida de forma prolongada: la hipotermia protege las neuronas.',
           'Vigila constants i consciència fins al SVA; si entra en parada cardiorespiratòria, RCP mantinguda de forma prolongada: la hipotèrmia protegix les neurones.'),
      why: T('Por debajo de 26 °C puede aparecer fibrilación y parada; la RCP en hipotermia se mantiene.',
             'Per davall de 26 °C pot aparéixer fibril·lació i parada; l\'RCP en hipotèrmia es manté.'),
      ref: 'U24.3.1 · U18',
      alts: [
        { t: T('Darle el alta cuando deje de tiritar.', 'Donar-li l\'alta quan deixe de tremolar.'),
          why: T('Dejar de tiritar puede ser empeoramiento (temblor fino, rigidez); evaluación sanitaria.', 'Deixar de tremolar pot ser empitjorament (tremolor fi, rigidesa); avaluació sanitària.') }
      ] }
  ],
  notes: [T('Grados: ~35 °C escalofríos y tiritona; <35 °C temblor fino, confusión, descoordinación; <32 °C rigidez, habla difícil, menos consciencia; <28 °C coma; <26 °C fibrilación y parada.',
            'Graus: ~35 °C calfreds i tremolor; <35 °C tremolor fi, confusió, descoordinació; <32 °C rigidesa, parla difícil, menys consciència; <28 °C coma; <26 °C fibril·lació i parada.')]
},

/* ---------------------------------------------------------------- 12 */
{
  id: 'agu-ahog3', env: 'aguas', sit: 'ahogamiento', tags: ['rcp'],
  title: T('Ahogamiento grado 3: no respira pero tiene pulso', 'Ofegament grau 3: no respira però té pols'),
  victim: T('Chico de 19 años', 'Xic de 19 anys'),
  scene: T('Zona de baño de un río, 19:30. Un amigo ha sacado a la orilla de piedras a un chico que se hundió al cruzar una poza. Está inconsciente, con los labios morados. No sabes si se golpeó contra las rocas. Tienes guantes, mascarilla de bolsillo y el móvil; el amigo está contigo.',
            'Zona de bany d\'un riu, 19:30. Un amic ha tret a la vora de pedres un xic que es va enfonsar en creuar una tolla. Està inconscient, amb els llavis morats. No saps si es va colpejar contra les roques. Tens guants, mascareta de butxaca i el mòbil; l\'amic està amb tu.'),
  pa: [
    { t: T('Guantes y mascarilla de bolsillo a mano; comprueba la consciencia: no responde.',
           'Guants i mascareta de butxaca a mà; comprova la consciència: no respon.'),
      why: T('Protección y valoración de consciencia antes de la respiración.',
             'Protecció i valoració de consciència abans de la respiració.'),
      ref: 'U11 · U15',
      alts: [
        { crit: true, t: T('Ponerlo de pie y golpearle la espalda para que escupa el agua.', 'Posar-lo de peu i colpejar-li l\'esquena perquè escupa l\'aigua.'),
          why: T('No es una maniobra de desobstrucción válida en el ahogado y mueve una posible lesión cervical.', 'No és una maniobra de desobstrucció vàlida en l\'ofegat i mou una possible lesió cervical.') }
      ] },
    { t: T('A: abre la vía aérea con control cervical (posible golpe contra las rocas): tracción mandibular o frente-mentón mínima.',
           'A: obri la via aèria amb control cervical (possible colp contra les roques): tracció mandibular o front-mentó mínima.'),
      why: T('Mecanismo desconocido con rocas: se trata como posible lesión cervical.',
             'Mecanisme desconegut amb roques: es tracta com a possible lesió cervical.'),
      ref: 'U11 · U19',
      alts: [
        { t: T('Hiperextensión máxima del cuello para abrir bien.', 'Hiperextensió màxima del coll per a obrir bé.'),
          why: T('Con posible trauma, control cervical.', 'Amb possible trauma, control cervical.') }
      ] },
    { t: T('B: VOS 10 segundos: no respira. C: pulso carotídeo hasta 10 segundos: tiene pulso → ahogamiento grado 3, parada cardíaca inminente.',
           'B: VOS 10 segons: no respira. C: pols carotidi fins a 10 segons: té pols → ofegament grau 3, parada cardíaca imminent.'),
      why: T('Grado 3: no respira pero tiene pulso. Se inicia reanimación respiratoria.',
             'Grau 3: no respira però té pols. S\'inicia reanimació respiratòria.'),
      ref: 'U18.6',
      alts: [
        { t: T('Empezar compresiones 30:2 aunque tenga pulso.', 'Començar compressions 30:2 encara que tinga pols.'),
          why: T('Con pulso presente, el problema es respiratorio: insuflaciones.', 'Amb pols present, el problema és respiratori: insuflacions.') },
        { crit: true, t: T('Heimlich para sacar el agua de los pulmones.', 'Heimlich per a traure l\'aigua dels pulmons.'),
          why: T('Ineficaz, retrasa la reanimación y provoca vómito y aspiración.', 'Ineficaç, retarda la reanimació i provoca vòmit i aspiració.') }
      ] },
    { t: T('5 insuflaciones de rescate con la mascarilla de bolsillo, cada una hasta ligera elevación del tórax.',
           '5 insuflacions de rescat amb la mascareta de butxaca, cada una fins a lleugera elevació del tòrax.'),
      why: T('Apertura de vía aérea y 5 insuflaciones de rescate iniciales.',
             'Obertura de via aèria i 5 insuflacions de rescat inicials.'),
      ref: 'U18.6 Grado 3',
      alts: [
        { t: T('Dos insuflaciones y comprobar.', 'Dos insuflacions i comprovar.'),
          why: T('Son cinco.', 'Són cinc.') }
      ] },
    { t: T('Que el amigo llame al 112 indicando el lugar exacto, "ahogamiento, no respira, tiene pulso", y vaya a guiar al SVA.',
           'Que l\'amic cride el 112 indicant el lloc exacte, "ofegament, no respira, té pols", i vaja a guiar el SVA.'),
      why: T('Avisar al 112 con ubicación, número de víctimas, edad y lesiones; en espacios naturales, alguien tiene que guiar.',
             'Avisar el 112 amb ubicació, nombre de víctimes, edat i lesions; en espais naturals, algú ha de guiar.'),
      ref: 'U11 PAS Avisar',
      alts: [
        { t: T('Llamar tú y dejar de ventilar mientras hablas.', 'Cridar tu i deixar de ventilar mentre parles.'),
          why: T('Delega; tú sigues ventilando.', 'Delega; tu continues ventilant.') }
      ] },
    { t: T('Continúa con una insuflación cada 5 segundos (10-12 por minuto), comprobando pulso y respiración cada minuto.',
           'Continua amb una insuflació cada 5 segons (10-12 per minut), comprovant pols i respiració cada minut.'),
      why: T('Reanimación respiratoria: 1 insuflación cada 5 s mientras mantenga pulso.',
             'Reanimació respiratòria: 1 insuflació cada 5 s mentre mantinga pols.'),
      ref: 'U18.6 · U15',
      alts: [
        { t: T('Una insuflación cada 15 segundos para no hiperventilarlo.', 'Una insuflació cada 15 segons per a no hiperventilar-lo.'),
          why: T('Cada 5-6 segundos: 10-12 respiraciones por minuto.', 'Cada 5-6 segons: 10-12 respiracions per minut.') }
      ] },
    { t: T('Si pierde el pulso: RCP 30:2 con control cervical (cabeza ladeada en bloque), hasta relevo; si recupera la respiración: decúbito supino con control cervical, abrigar y reevaluar hasta el SVA.',
           'Si perd el pols: RCP 30:2 amb control cervical (cap de costat en bloc), fins a relleu; si recupera la respiració: decúbit supí amb control cervical, abrigar i reavaluar fins al SVA.'),
      why: T('Grado 3 puede pasar a grado 4; con posible trauma, la PLS se evita y se mantiene el eje.',
             'Grau 3 pot passar a grau 4; amb possible trauma, la PLS s\'evita i es manté l\'eix.'),
      ref: 'U18 · U11',
      alts: [
        { t: T('Dejar de comprobar el pulso: con las insuflaciones basta.', 'Deixar de comprovar el pols: amb les insuflacions n\'hi ha prou.'),
          why: T('Reevaluación periódica: si pierde el pulso, compresiones.', 'Reavaluació periòdica: si perd el pols, compressions.') }
      ] }
  ],
  notes: [T('Grado 5: sin respiración ni pulso con más de una hora de sumersión o signos cadavéricos claros → activar respuesta policial por el 112. Las sumersiones de menos de 10 minutos tienen pronóstico favorable; el agua fría amplía la ventana.',
            'Grau 5: sense respiració ni pols amb més d\'una hora de submersió o signes cadavèrics clars → activar resposta policial pel 112. Les submersions de menys de 10 minuts tenen pronòstic favorable; l\'aigua freda amplia la finestra.')]
}
];
