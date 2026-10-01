/* ===== Banco de preguntas tipo examen =====
   { q, opts:[{t, ok?, d?}], expl, topic }   d:true = respuesta que causaría daño a la víctima (invalida el examen) */

const Q = (q, opts, expl, topic) => ({ q, opts, expl, topic });
const O = (es, va, flags) => Object.assign({ t: T(es, va) }, flags || {});

const EXAM = [
  Q(T('En la valoración primaria ABCDE, ¿qué valora la letra D?', 'En la valoració primària ABCDE, què valora la lletra D?'), [
    O('La valoración neurológica (nivel de consciencia): AVDN o escala de Glasgow', 'La valoració neurològica (nivell de consciència): AVDN o escala de Glasgow', { ok: true }),
    O('El "desorden neurológico" de la víctima', 'El "desorde neurològic" de la víctima'),
    O('La desfibrilación precoz', 'La desfibril·lació precoç'),
    O('El dolor que refiere la víctima', 'El dolor que referix la víctima')
  ], T('D = Disability: valoración neurológica con AVDN (Alerta, Verbal, Dolor, No responde) o Glasgow. Si no responde pero respira, PLS. "Desorden neurológico" fue el fallo corregido por Raquel.', 'D = Disability: valoració neurològica amb AVDN (Alerta, Verbal, Dolor, No respon) o Glasgow. Si no respon però respira, PLS. "Desorde neurològic" va ser l\'error corregit per Raquel.'), 'abcde'),

  Q(T('En socorrismo acuático, la A del ABCDE es…', 'En socorrisme aquàtic, la A de l\'ABCDE és…'), [
    O('Apertura de la vía aérea con control cervical', 'Obertura de la via aèria amb control cervical', { ok: true }),
    O('Apertura de la vía aérea con hiperextensión máxima siempre', 'Obertura de la via aèria amb hiperextensió màxima sempre'),
    O('Avisar al 112', 'Avisar el 112'),
    O('Aspirar el agua de los pulmones', 'Aspirar l\'aigua dels pulmons')
  ], T('En el medio acuático la A incluye siempre el control cervical por la posible lesión medular (zambullida). Ante sospecha clara: tracción o subluxación mandibular, no frente-mentón.', 'En el medi aquàtic la A inclou sempre el control cervical per la possible lesió medul·lar (capbussada). Davant sospita clara: tracció o subluxació mandibular, no front-mentó.'), 'abcde'),

  Q(T('Sacas del agua a un bañista que no responde y no respira. ¿Qué haces primero tras abrir la vía aérea?', 'Traus de l\'aigua un banyista que no respon i no respira. Què fas primer després d\'obrir la via aèria?'), [
    O('5 insuflaciones de rescate iniciales', '5 insuflacions de rescat inicials', { ok: true }),
    O('30 compresiones torácicas', '30 compressions toràciques'),
    O('Compresiones abdominales para drenar el agua', 'Compressions abdominals per a drenar l\'aigua', { d: true }),
    O('Colocarlo en posición lateral de seguridad', 'Col·locar-lo en posició lateral de seguretat', { d: true })
  ], T('Según ERC/ILSF y RFESS, en el ahogado la hipoxia manda: 5 insuflaciones de rescate antes de las compresiones. Nunca Heimlich para "sacar agua".', 'Segons ERC/ILSF i RFESS, en l\'ofegat la hipòxia mana: 5 insuflacions de rescat abans de les compressions. Mai Heimlich per a "traure aigua".'), 'ahogamiento'),

  Q(T('Víctima rescatada que respira con dificultad, ruidos respiratorios, tos con espuma y desorientación. Grado y actuación:', 'Víctima rescatada que respira amb dificultat, sorolls respiratoris, tos amb escuma i desorientació. Grau i actuació:'), [
    O('Grado 2: avisar al 112, PLS preferiblemente del lado derecho y reevaluación constante', 'Grau 2: avisar el 112, PLS preferiblement del costat dret i reavaluació constant', { ok: true }),
    O('Grado 1: sentada y abrigada, sin necesidad de avisar', 'Grau 1: asseguda i abrigada, sense necessitat d\'avisar'),
    O('Grado 3: 5 insuflaciones de rescate', 'Grau 3: 5 insuflacions de rescat', { d: true }),
    O('Grado 0: atención psicológica', 'Grau 0: atenció psicològica')
  ], T('Grado 2 = ruidos, tos con espuma, desorientación, no colabora: 112 + PLS derecha + favorecer la tos, sin dejarla sola.', 'Grau 2 = sorolls, tos amb escuma, desorientació, no col·labora: 112 + PLS dreta + afavorir la tos, sense deixar-la sola.'), 'ahogamiento'),

  Q(T('Ahogado que no respira pero tiene pulso (grado 3). Tras las 5 insuflaciones iniciales…', 'Ofegat que no respira però té pols (grau 3). Després de les 5 insuflacions inicials…'), [
    O('Se continúa con una insuflación cada 5 segundos, reevaluando pulso y respiración', 'Es continua amb una insuflació cada 5 segons, reavaluant pols i respiració', { ok: true }),
    O('Se inician compresiones 30:2 aunque tenga pulso', 'S\'inicien compressions 30:2 encara que tinga pols'),
    O('Se coloca en PLS', 'Es col·loca en PLS', { d: true }),
    O('Se espera al DESA sin hacer nada más', 'S\'espera el DESA sense fer res més', { d: true })
  ], T('Grado 3: reanimación respiratoria a 1 insuflación cada 5 s, avisar al 112 y comprobar pulso; si lo pierde, RCP.', 'Grau 3: reanimació respiratòria a 1 insuflació cada 5 s, avisar el 112 i comprovar pols; si el perd, RCP.'), 'ahogamiento'),

  Q(T('¿Por qué no se hacen compresiones abdominales para sacar el agua de los pulmones de un ahogado?', 'Per què no es fan compressions abdominals per a traure l\'aigua dels pulmons d\'un ofegat?'), [
    O('No está probada su eficacia, retrasan la reanimación y aumentan el riesgo de vómito y aspiración', 'No està provada la seua eficàcia, retarden la reanimació i augmenten el risc de vòmit i aspiració', { ok: true }),
    O('Porque solo pueden hacerlas los sanitarios', 'Perquè només poden fer-les els sanitaris'),
    O('Sí se hacen, antes de las insuflaciones', 'Sí que es fan, abans de les insuflacions', { d: true }),
    O('Porque el agua ya se ha absorbido', 'Perquè l\'aigua ja s\'ha absorbit')
  ], T('Solo si no se consigue ventilar se sospecha cuerpo extraño y se aplican técnicas de desobstrucción (U17).', 'Només si no s\'aconseguix ventilar se sospita cos estrany i s\'apliquen tècniques de desobstrucció (U17).'), 'ahogamiento'),

  Q(T('Uso del DESA en la playa tras un rescate:', 'Ús del DESA en la platja després d\'un rescat:'), [
    O('Secar el tórax, retirar la arena y no descargar sobre suelo mojado', 'Assecar el tòrax, retirar l\'arena i no descarregar sobre terra mullada', { ok: true }),
    O('Descargar lo antes posible aunque la víctima esté en la orilla mojada', 'Descarregar com més prompte millor encara que la víctima estiga en la vora mullada', { d: true }),
    O('No se puede usar el DESA en ahogados', 'No es pot usar el DESA en ofegats'),
    O('Colocar los parches sobre el bañador para que no resbalen', 'Col·locar els pegats sobre el banyador perquè no rellisquen')
  ], T('Tórax seco y sin arena para la adhesión de los parches; nunca descargas sobre suelo mojado.', 'Tòrax sec i sense arena per a l\'adhesió dels pegats; mai descàrregues sobre terra mullada.'), 'rcp'),

  Q(T('Posición de los parches del DESA en un adulto:', 'Posició dels pegats del DESA en un adult:'), [
    O('Bajo la clavícula derecha y bajo la axila izquierda', 'Davall la clavícula dreta i davall l\'aixella esquerra', { ok: true }),
    O('En el esternón y en la espalda (anteroposterior)', 'En l\'estern i en l\'esquena (anteroposterior)'),
    O('Bajo las dos clavículas', 'Davall les dos clavícules'),
    O('Bajo las dos axilas', 'Davall les dos aixelles')
  ], T('Adulto: clavícula derecha + axila izquierda (10 cm de la axila). Niño ≤8 años o ≤25 kg: anteroposterior.', 'Adult: clavícula dreta + aixella esquerra (10 cm de l\'aixella). Xiquet ≤8 anys o ≤25 kg: anteroposterior.'), 'rcp'),

  Q(T('Parámetros de las compresiones en la RCP del adulto:', 'Paràmetres de les compressions en l\'RCP de l\'adult:'), [
    O('100-120 por minuto, 5-6 cm de profundidad, relación 30:2', '100-120 per minut, 5-6 cm de profunditat, relació 30:2', { ok: true }),
    O('60-80 por minuto, 3-4 cm, relación 15:2', '60-80 per minut, 3-4 cm, relació 15:2'),
    O('120-140 por minuto, 7-8 cm, relación 30:2', '120-140 per minut, 7-8 cm, relació 30:2'),
    O('100-120 por minuto, 5-6 cm, relación 15:2', '100-120 per minut, 5-6 cm, relació 15:2')
  ], T('Talón de la mano sobre el esternón, brazos rectos, peso del cuerpo y dejar que el tórax se expanda tras cada compresión.', 'Taló de la mà sobre l\'estern, braços rectes, pes del cos i deixar que el tòrax s\'expandisca després de cada compressió.'), 'rcp'),

  Q(T('RCP pediátrica (niño de 1 a 8 años) con dos reanimadores:', 'RCP pediàtrica (xiquet d\'1 a 8 anys) amb dos reanimadors:'), [
    O('5 insuflaciones iniciales y ciclos 15:2', '5 insuflacions inicials i cicles 15:2', { ok: true }),
    O('2 insuflaciones iniciales y ciclos 30:2', '2 insuflacions inicials i cicles 30:2'),
    O('Sin insuflaciones iniciales, ciclos 30:2', 'Sense insuflacions inicials, cicles 30:2'),
    O('5 insuflaciones iniciales y ciclos 3:1', '5 insuflacions inicials i cicles 3:1')
  ], T('PCR infantil de causa respiratoria: 5 insuflaciones de rescate; 30:2 con un reanimador, 15:2 con dos; 3:1 en recién nacido.', 'PCR infantil de causa respiratòria: 5 insuflacions de rescat; 30:2 amb un reanimador, 15:2 amb dos; 3:1 en nounat.'), 'rcp'),

  Q(T('¿Cuánto tiempo como máximo se dedica al "Ver, Oír, Sentir"?', 'Quant de temps com a màxim es dedica al "Veure, Oir, Sentir"?'), [
    O('10 segundos', '10 segons', { ok: true }),
    O('30 segundos', '30 segons'),
    O('1 minuto', '1 minut'),
    O('5 segundos', '5 segons')
  ], T('VOS ≤10 s; si no respira o solo boquea, se inicia la reanimación. Toda la valoración inicial dura menos de un minuto.', 'VOS ≤10 s; si no respira o només boqueja, s\'inicia la reanimació. Tota la valoració inicial dura menys d\'un minut.'), 'rcp'),

  Q(T('La posición lateral de seguridad está contraindicada cuando…', 'La posició lateral de seguretat està contraindicada quan…'), [
    O('Hay sospecha de lesión medular', 'Hi ha sospita de lesió medul·lar', { ok: true }),
    O('La víctima está inconsciente', 'La víctima està inconscient'),
    O('La víctima ha vomitado', 'La víctima ha vomitat'),
    O('Hace frío', 'Fa fred')
  ], T('PLS: para inconscientes que respiran; contraindicada con sospecha de lesión medular (se mantiene decúbito supino alineado).', 'PLS: per a inconscients que respiren; contraindicada amb sospita de lesió medul·lar (es manté decúbit supí alineat).'), 'medular'),

  Q(T('Regla de oro ante un inconsciente en el agua:', 'Regla d\'or davant un inconscient en l\'aigua:'), [
    O('Es una lesión medular hasta que se demuestre lo contrario', 'És una lesió medul·lar fins que es demostre el contrari', { ok: true }),
    O('Es un síncope hasta que se demuestre lo contrario', 'És un síncope fins que es demostre el contrari'),
    O('Siempre se remolca boca abajo para no mover el cuello', 'Sempre es remolca boca avall per a no moure el coll', { d: true }),
    O('Se espera a los sanitarios dentro del agua', 'S\'esperen els sanitaris dins de l\'aigua', { d: true })
  ], T('Salvamento C6: todo inconsciente en el agua es LM hasta que se demuestre lo contrario; pero las vías aéreas van siempre fuera del agua.', 'Salvament C6: tot inconscient en l\'aigua és LM fins que es demostre el contrari; però les vies aèries van sempre fora de l\'aigua.'), 'medular'),

  Q(T('¿Qué técnica de control del accidentado es la única que libera la tensión intervertebral?', 'Quina tècnica de control de l\'accidentat és l\'única que allibera la tensió intervertebral?'), [
    O('La tracción (RFESS)', 'La tracció (RFESS)', { ok: true }),
    O('El torno', 'El torn'),
    O('Bíceps-tríceps', 'Bíceps-tríceps'),
    O('El dedo mágico', 'El dit màgic')
  ], T('Tracción: manos en la cabeza, tracción cervical constante, posición neutra; mínimo dos socorristas. Torno: no tracciona y es exigente. Bíceps-tríceps: sencilla, con las vías destapadas.', 'Tracció: mans en el cap, tracció cervical constant, posició neutra; mínim dos socorristes. Torn: no tracciona i és exigent. Bíceps-tríceps: senzilla, amb les vies destapades.'), 'medular'),

  Q(T('¿Dónde ocurren el 80 % de las lesiones medulares en el medio acuático?', 'On ocorren el 80 % de les lesions medul·lars en el medi aquàtic?'), [
    O('En aguas poco profundas', 'En aigües poc profundes', { ok: true }),
    O('En aguas abiertas con oleaje', 'En aigües obertes amb onatge'),
    O('En la zona profunda de las piscinas', 'En la zona profunda de les piscines'),
    O('En parques acuáticos', 'En parcs aquàtics')
  ], T('El mecanismo más común en el agua es la compresión axial por zambullida en aguas poco profundas.', 'El mecanisme més comú en l\'aigua és la compressió axial per capbussada en aigües poc profundes.'), 'medular'),

  Q(T('Orden de las cinchas al fijar a la víctima en el tablero espinal:', 'Orde de les cintes en fixar la víctima en el tauler espinal:'), [
    O('Tórax → caderas → piernas; después la Dama de Elche en frente y barbilla', 'Tòrax → malucs → cames; després la Dama d\'Elx en front i barbeta', { ok: true }),
    O('Piernas → caderas → tórax; la cabeza primero', 'Cames → malucs → tòrax; el cap primer'),
    O('Cabeza → tórax → piernas', 'Cap → tòrax → cames'),
    O('El orden es indiferente', 'L\'orde és indiferent')
  ], T('Salvamento C11: tablero perpendicular bajo la espalda, cinchas tórax, caderas y piernas, inmovilizador tetracameral al final, sin soltar la tracción hasta estar fijada.', 'Salvament C11: tauler perpendicular davall l\'esquena, cintes tòrax, malucs i cames, immobilitzador tetracameral al final, sense soltar la tracció fins a estar fixada.'), 'medular'),

  Q(T('La extracción de una lesión medular del agua con tablero…', 'L\'extracció d\'una lesió medul·lar de l\'aigua amb tauler…'), [
    O('Es rasante, manteniendo la tracción, puede llevar 5-8 minutos y no se acelera', 'És arran, mantenint la tracció, pot portar 5-8 minuts i no s\'accelera', { ok: true }),
    O('Debe hacerse en menos de un minuto', 'Ha de fer-se en menys d\'un minut'),
    O('Se hace sentando a la víctima en el bordillo', 'Es fa asseient la víctima en la vorera', { d: true }),
    O('La puede hacer un solo socorrista', 'La pot fer un sol socorrista')
  ], T('Si la víctima respira, las prisas son el enemigo: izado manteniendo tracción mayor que empuje y tumbar sin soltar. Si no respira, prioridad a la ventilación: extracción inmediata.', 'Si la víctima respira, les presses són l\'enemic: hissat mantenint tracció major que espenta i gitar sense soltar. Si no respira, prioritat a la ventilació: extracció immediata.'), 'medular'),

  Q(T('Adulto consciente con obstrucción completa de la vía aérea (no tose, no habla):', 'Adult conscient amb obstrucció completa de la via aèria (no tus, no parla):'), [
    O('5 golpes interescapulares alternados con 5 compresiones abdominales; si pierde la consciencia, RCP', '5 colps interescapulars alternats amb 5 compressions abdominals; si perd la consciència, RCP', { ok: true }),
    O('Animarle a toser y esperar', 'Animar-lo a tossir i esperar'),
    O('Barrido digital a ciegas de la boca', 'Escombratge digital a cegues de la boca', { d: true }),
    O('Darle agua para que trague el objeto', 'Donar-li aigua perquè engolisca l\'objecte', { d: true })
  ], T('Obstrucción parcial: animar a toser. Completa: Heimlich (5+5) mientras esté consciente; inconsciente → RCP inmediata. Nunca barrido a ciegas.', 'Obstrucció parcial: animar a tossir. Completa: Heimlich (5+5) mentre estiga conscient; inconscient → RCP immediata. Mai escombratge a cegues.'), 'ovace'),

  Q(T('OVACE en un lactante menor de un año:', 'OVACE en un lactant menor d\'un any:'), [
    O('Boca abajo sobre el antebrazo: 5 golpes interescapulares alternados con 5 compresiones torácicas con dos dedos', 'Boca avall sobre l\'avantbraç: 5 colps interescapulars alternats amb 5 compressions toràciques amb dos dits', { ok: true }),
    O('Maniobra de Heimlich adaptada a su tamaño', 'Maniobra de Heimlich adaptada a la seua grandària', { d: true }),
    O('Barrido digital para sacar el objeto', 'Escombratge digital per a traure l\'objecte', { d: true }),
    O('Sacudirlo cabeza abajo', 'Sacsejar-lo cap avall', { d: true })
  ], T('Lactante: NO Heimlich, NO barridos. Golpes interescapulares y compresiones torácicas en la mitad inferior del esternón.', 'Lactant: NO Heimlich, NO escombratges. Colps interescapulars i compressions toràciques en la meitat inferior de l\'estern.'), 'ovace'),

  Q(T('Atragantamiento completo en una embarazada o en una persona obesa:', 'Ennuegament complet en una embarassada o en una persona obesa:'), [
    O('Sustituir las compresiones abdominales por 5 compresiones torácicas en la zona media del esternón', 'Substituir les compressions abdominals per 5 compressions toràciques en la zona mitjana de l\'estern', { ok: true }),
    O('Heimlich normal, con más fuerza', 'Heimlich normal, amb més força', { d: true }),
    O('Solo golpes en la espalda', 'Només colps en l\'esquena'),
    O('Esperar a que pierda la consciencia para hacer RCP', 'Esperar que perda la consciència per a fer RCP', { d: true })
  ], T('No se puede abarcar el perímetro y hay riesgo fetal: compresiones torácicas separadas unos 2 s entre sí.', 'No es pot abastar el perímetre i hi ha risc fetal: compressions toràciques separades uns 2 s entre si.'), 'ovace'),

  Q(T('Primera medida ante una hemorragia externa:', 'Primera mesura davant una hemorràgia externa:'), [
    O('Compresión directa sobre la herida con gasa o apósito, al menos 10 minutos sin levantarlo', 'Compressió directa sobre la ferida amb gasa o apòsit, almenys 10 minuts sense alçar-lo', { ok: true }),
    O('Torniquete por encima de la herida', 'Torniquet per damunt de la ferida'),
    O('Lavar la herida con agua a presión', 'Llavar la ferida amb aigua a pressió'),
    O('Elevar la extremidad sin comprimir', 'Elevar l\'extremitat sense comprimir')
  ], T('Actuación escalonada: 1) compresión directa ≥10 min, 2) elevar, 3) compresión arterial, 4) torniquete como último recurso o ante hemorragia masiva/amputación.', 'Actuació esglaonada: 1) compressió directa ≥10 min, 2) elevar, 3) compressió arterial, 4) torniquet com a últim recurs o davant hemorràgia massiva/amputació.'), 'hemorragia'),

  Q(T('Reglas del torniquete:', 'Regles del torniquet:'), [
    O('5-7 cm por encima del punto de sangrado, nunca sobre articulaciones, anotar la hora y nunca aflojarlo', '5-7 cm per damunt del punt de sagnat, mai sobre articulacions, anotar l\'hora i mai afluixar-lo', { ok: true }),
    O('Sobre la articulación más cercana, aflojando cada 10 minutos', 'Sobre l\'articulació més pròxima, afluixant cada 10 minuts', { d: true }),
    O('Lo más lejos posible de la herida, sin apretar mucho para que no duela', 'Com més lluny millor de la ferida, sense apretar molt perquè no faça mal'),
    O('Solo en el tronco', 'Només en el tronc')
  ], T('Un torniquete bien colocado duele. Daño leve a partir de 2 horas, grave a partir de 6: traslado lo antes posible.', 'Un torniquet ben col·locat fa mal. Dany lleu a partir de 2 hores, greu a partir de 6: trasllat com més prompte millor.'), 'hemorragia'),

  Q(T('Ante un objeto clavado en una herida:', 'Davant un objecte clavat en una ferida:'), [
    O('Nunca retirarlo; inmovilizarlo y trasladar', 'Mai retirar-lo; immobilitzar-lo i traslladar', { ok: true }),
    O('Retirarlo rápidamente para poder comprimir', 'Retirar-lo ràpidament per a poder comprimir', { d: true }),
    O('Retirarlo solo si es pequeño', 'Retirar-lo només si és xicotet', { d: true }),
    O('Empujarlo hacia dentro para que no se mueva', 'Espentar-lo cap a dins perquè no es moga', { d: true })
  ], T('U22: NUNCA retirar cuerpos extraños clavados en la herida; NUNCA dar de beber ni de comer.', 'U22: MAI retirar cossos estranys clavats en la ferida; MAI donar de beure ni de menjar.'), 'hemorragia'),

  Q(T('Actuación ante una epistaxis (sangrado nasal):', 'Actuació davant una epistaxi (sagnat nasal):'), [
    O('Cabeza inclinada hacia delante y compresión de la aleta nasal', 'Cap inclinat cap avant i compressió de l\'aleta nasal', { ok: true }),
    O('Cabeza hacia atrás para que no sangre', 'Cap cap arrere perquè no sagne', { d: true }),
    O('Tumbar boca arriba', 'Gitar boca amunt'),
    O('Taponar con algodón las dos fosas y acostar', 'Taponar amb cotó les dos fosses i gitar')
  ], T('Cabeza adelante, comprimir el ala nasal, frío local; si persiste, taponamiento con gasa y traslado.', 'Cap avant, comprimir l\'ala nasal, fred local; si persistix, taponament amb gasa i trasllat.'), 'hemorragia'),

  Q(T('Otorragia (sangre por el oído) tras un traumatismo craneal:', 'Otorràgia (sang per l\'orella) després d\'un traumatisme cranial:'), [
    O('No taponar ni movilizar; apósito que recoja el drenaje y traslado urgente', 'No taponar ni mobilitzar; apòsit que arreplegue el drenatge i trasllat urgent', { ok: true }),
    O('Taponar el oído con gasa', 'Taponar l\'orella amb gasa', { d: true }),
    O('Girar la cabeza hacia el lado contrario', 'Girar el cap cap al costat contrari', { d: true }),
    O('Lavar el oído con suero', 'Llavar l\'orella amb sèrum')
  ], T('Puede ser una fractura de base de cráneo: no comprimir ni taponar.', 'Pot ser una fractura de base de crani: no comprimir ni taponar.'), 'hemorragia'),

  Q(T('Signos de shock y posición indicada:', 'Signes de xoc i posició indicada:'), [
    O('Palidez, piel fría, taquicardia, relleno capilar >2 s → tumbado con piernas elevadas unos 30 cm, abrigado y nada por boca', 'Pal·lidesa, pell freda, taquicàrdia, reompliment capil·lar >2 s → gitat amb cames elevades uns 30 cm, abrigat i res per boca', { ok: true }),
    O('Piel caliente y seca → sentado con bebida azucarada', 'Pell calenta i seca → assegut amb beguda ensucrada', { d: true }),
    O('Pulso lento y fuerte → caminar para activar la circulación', 'Pols lent i fort → caminar per a activar la circulació'),
    O('Cualquier signo → posición de Fowler', 'Qualsevol signe → posició de Fowler')
  ], T('U20: posición antishock, soporte ventilatorio, manta térmica, aflojar ropas; NUNCA líquidos ni sólidos por vía oral.', 'U20: posició antixoc, suport ventilatori, manta tèrmica, afluixar robes; MAI líquids ni sòlids per via oral.'), 'shock'),

  Q(T('Hipotermia: definición y actuación', 'Hipotèrmia: definició i actuació'), [
    O('Temperatura <35 °C; ambiente >32 °C, retirar ropa mojada, manta térmica dorado hacia fuera, líquidos calientes azucarados si no hay estupor', 'Temperatura <35 °C; ambient >32 °C, retirar roba mullada, manta tèrmica daurat cap a fora, líquids calents ensucrats si no hi ha estupor', { ok: true }),
    O('Temperatura <37 °C; dar alcohol para entrar en calor', 'Temperatura <37 °C; donar alcohol per a entrar en calor', { d: true }),
    O('Temperatura <35 °C; frotar enérgicamente las extremidades y ducha muy caliente', 'Temperatura <35 °C; fregar enèrgicament les extremitats i dutxa molt calenta'),
    O('Temperatura <30 °C; dejar la ropa mojada para no enfriarle más', 'Temperatura <30 °C; deixar la roba mullada per a no refredar-lo més')
  ], T('U24.3.1: manta con el dorado hacia fuera, abrigar incluida la cabeza, evitar estimulantes y alcohol, valorar constantes y RCP si precisa.', 'U24.3.1: manta amb el daurat cap a fora, abrigar inclòs el cap, evitar estimulants i alcohol, valorar constants i RCP si cal.'), 'hipotermia'),

  Q(T('Parada cardiorrespiratoria en un ahogado con hipotermia:', 'Parada cardiorespiratòria en un ofegat amb hipotèrmia:'), [
    O('Se mantiene la RCP de forma prolongada: la hipotermia protege las células al reducir la demanda de oxígeno', 'Es manté l\'RCP de forma prolongada: la hipotèrmia protegix les cèl·lules en reduir la demanda d\'oxigen', { ok: true }),
    O('Se suspende a los 10 minutos si no responde', 'Se suspén als 10 minuts si no respon', { d: true }),
    O('No se inicia RCP hasta recalentar a la víctima', 'No s\'inicia RCP fins a reescalfar la víctima', { d: true }),
    O('Se duplica la frecuencia de compresiones', 'Es duplica la freqüència de compressions')
  ], T('Las paradas en hipotermia pueden recuperarse sin lesiones neuronales tras periodos prolongados (más de 10 min, menos de 1 h).', 'Les parades en hipotèrmia poden recuperar-se sense lesions neuronals després de períodes prolongats (més de 10 min, menys d\'1 h).'), 'hipotermia'),

  Q(T('Diferencia clave entre insolación (agotamiento por calor) y golpe de calor:', 'Diferència clau entre insolació (esgotament per calor) i colp de calor:'), [
    O('En la insolación la piel está caliente y sudorosa; en el golpe de calor, enrojecida y seca, con confusión', 'En la insolació la pell està calenta i suada; en el colp de calor, envermellida i seca, amb confusió', { ok: true }),
    O('El golpe de calor solo ocurre en ancianos', 'El colp de calor només ocorre en ancians'),
    O('La insolación es más grave que el golpe de calor', 'La insolació és més greu que el colp de calor'),
    O('No hay diferencia; se tratan igual', 'No hi ha diferència; es tracten igual')
  ], T('Golpe de calor: fracaso de la termorregulación (>40 °C), emergencia: sábana húmeda, ventilación, 112 y traslado urgente.', 'Colp de calor: fracàs de la termoregulació (>40 °C), emergència: llençol humit, ventilació, 112 i trasllat urgent.'), 'calor'),

  Q(T('Actuación ante un golpe de calor:', 'Actuació davant un colp de calor:'), [
    O('Reposo a la sombra, retirar ropa, envolver en sábana húmeda, favorecer el aire, líquidos solo si está consciente y 112', 'Repòs a l\'ombra, retirar roba, embolicar en llençol humit, afavorir l\'aire, líquids només si està conscient i 112', { ok: true }),
    O('Abrigar con manta térmica para que sude', 'Abrigar amb manta tèrmica perquè sue', { d: true }),
    O('Dar de beber abundantemente aunque esté confuso', 'Donar de beure abundantment encara que estiga confús', { d: true }),
    O('Paracetamol y reposo en casa', 'Paracetamol i repòs a casa')
  ], T('Con alteración de la consciencia, nada por boca; el socorrista no administra fármacos.', 'Amb alteració de la consciència, res per boca; el socorrista no administra fàrmacs.'), 'calor'),

  Q(T('Picadura de medusa: actuación correcta', 'Picada de medusa: actuació correcta'), [
    O('Lavar con agua de mar o suero sin frotar, retirar restos con pinzas o cinta adhesiva, compresas de vinagre o amoniaco diluido 15 min y frío indirecto', 'Llavar amb aigua de mar o sèrum sense fregar, retirar restes amb pinces o cinta adhesiva, compreses de vinagre o amoníac diluït 15 min i fred indirecte', { ok: true }),
    O('Lavar con agua dulce de la ducha y frotar con arena', 'Llavar amb aigua dolça de la dutxa i fregar amb arena', { d: true }),
    O('Aplicar cubitos de hielo directamente sobre la piel', 'Aplicar glaçons directament sobre la pell'),
    O('Aplicar calor en todos los casos', 'Aplicar calor en tots els casos')
  ], T('No usar agua dulce, arena ni cubitos directos. Centro sanitario si síntomas generales o picadura en cara o cuello.', 'No usar aigua dolça, arena ni glaçons directes. Centre sanitari si símptomes generals o picada en cara o coll.'), 'medusa'),

  Q(T('Picadura de carabela portuguesa:', 'Picada de caravel·la portuguesa:'), [
    O('Se aplica calor, no frío', 'S\'aplica calor, no fred', { ok: true }),
    O('Se aplica hielo directo', 'S\'aplica gel directe'),
    O('Es inofensiva', 'És inofensiva'),
    O('Se lava con agua dulce', 'Es llava amb aigua dolça', { d: true })
  ], T('U26.3.3: ante picaduras por carabela se debe aplicar calor, no frío. Su picadura es peligrosa.', 'U26.3.3: davant picades per caravel·la s\'ha d\'aplicar calor, no fred. La seua picada és perillosa.'), 'medusa'),

  Q(T('Picadura de pez araña o escorpénido:', 'Picada de peix aranya o escorpènid:'), [
    O('Extraer las espinas, limpiar y mantener la zona en agua caliente a 40-50 °C durante 30 minutos', 'Extraure les espines, netejar i mantindre la zona en aigua calenta a 40-50 °C durant 30 minuts', { ok: true }),
    O('Hielo directo 30 minutos', 'Gel directe 30 minuts'),
    O('Torniquete en la extremidad', 'Torniquet en l\'extremitat', { d: true }),
    O('Succionar el veneno', 'Succionar el verí', { d: true })
  ], T('Las neurotoxinas son termolábiles: pierden toxicidad con el calor. Inmovilizar y acudir a urgencias para analgesia.', 'Les neurotoxines són termolàbils: perden toxicitat amb la calor. Immobilitzar i acudir a urgències per a analgèsia.'), 'medusa'),

  Q(T('Crisis convulsiva dentro del agua:', 'Crisi convulsiva dins de l\'aigua:'), [
    O('Mantener las vías aéreas fuera con la cabeza ladeada, no meter nada en la boca y esperar a que cesen las contracciones antes de extraer; después PLS', 'Mantindre les vies aèries fora amb el cap de costat, no ficar res en la boca i esperar que cessen les contraccions abans d\'extraure; després PLS', { ok: true }),
    O('Meter el tubo de rescate entre los dientes para que no se muerda', 'Ficar el tub de rescat entre les dents perquè no es mossegue', { d: true }),
    O('Extraerla inmediatamente usando la boya torpedo', 'Extraure-la immediatament usant la boia torpede'),
    O('Sujetar con fuerza los brazos y piernas hasta que pare', 'Subjectar amb força els braços i cames fins que pare')
  ], T('Salvamento C9: girar si está ventral, cabeza ladeada, nada en la boca; la boya torpedo no se recomienda por su rigidez. Grave si dura más de 5 minutos.', 'Salvament C9: girar si està ventral, cap de costat, res en la boca; la boia torpede no es recomana per la seua rigidesa. Greu si dura més de 5 minuts.'), 'convulsion'),

  Q(T('Rescate a través de corcheras:', 'Rescat a través de sureres:'), [
    O('Siempre pasar por encima y en oblicuo', 'Sempre passar per damunt i en oblic', { ok: true }),
    O('Siempre pasar por debajo', 'Sempre passar per davall'),
    O('Por encima y en perpendicular', 'Per damunt i en perpendicular'),
    O('Retirar la corchera antes del rescate', 'Retirar la surera abans del rescat')
  ], T('Salvamento C9: nunca por debajo.', 'Salvament C9: mai per davall.'), 'rescate'),

  Q(T('¿Qué significa el factor RID?', 'Què significa el factor RID?'), [
    O('Reconocer, Intromisiones, Distracciones', 'Reconéixer, Intromissions, Distraccions', { ok: true }),
    O('Rescate, Intervención, Desfibrilación', 'Rescat, Intervenció, Desfibril·lació'),
    O('Riesgo, Inmersión, Distrés', 'Risc, Immersió, Distrés'),
    O('Respirar, Insuflar, Desobstruir', 'Respirar, Insuflar, Desobstruir')
  ], T('Reconocer las pautas del ahogamiento (RIA), evitar intromisiones (cualquier labor que no sea vigilar) y distracciones.', 'Reconéixer les pautes de l\'ofegament (RIA), evitar intromissions (qualsevol labor que no siga vigilar) i distraccions.'), 'vigilancia'),

  Q(T('Signos de la Respuesta Instintiva al Ahogamiento (RIA):', 'Signes de la Resposta Instintiva a l\'Ofegament (RIA):'), [
    O('Posición vertical, cabeza atrás con la boca a ras de agua, brazos presionando el agua sin desplazarse, no grita', 'Posició vertical, cap arrere amb la boca arran d\'aigua, braços pressionant l\'aigua sense desplaçar-se, no crida', { ok: true }),
    O('Grita, agita los brazos y salpica mucho', 'Crida, agita els braços i esquitxa molt'),
    O('Nada rápido hacia la orilla pidiendo ayuda', 'Neda ràpid cap a la vora demanant ajuda'),
    O('Flota boca arriba relajado', 'Flota boca amunt relaxat')
  ], T('El ahogamiento es silencioso: la víctima activa no puede pedir ayuda porque usa cada salida a superficie para respirar.', 'L\'ofegament és silenciós: la víctima activa no pot demanar ajuda perquè usa cada eixida a superfície per a respirar.'), 'vigilancia'),

  Q(T('Eslabones y tiempos de la cadena de salvamento:', 'Baules i temps de la cadena de salvament:'), [
    O('Prevención (1 min) → Intervención → Primeros auxilios (5 min) → Transporte (20-30 min) → Centro sanitario', 'Prevenció (1 min) → Intervenció → Primers auxilis (5 min) → Transport (20-30 min) → Centre sanitari', { ok: true }),
    O('Aviso → Rescate → Hospital', 'Avís → Rescat → Hospital'),
    O('Vigilancia (10 min) → RCP (30 min) → Traslado (2 h)', 'Vigilància (10 min) → RCP (30 min) → Trasllat (2 h)'),
    O('Prevención → Extracción → Alta en el puesto', 'Prevenció → Extracció → Alta en el lloc')
  ], T('Tema 3.2: la cadena de salvamento es el mejor modelo organizativo, con un éxito del 99 %.', 'Tema 3.2: la cadena de salvament és el millor model organitzatiu, amb un èxit del 99 %.'), 'organizacion'),

  Q(T('Sobre el material de salvamento:', 'Sobre el material de salvament:'), [
    O('El tubo de rescate es ligero, flexible y el más versátil; la boya torpedo es rígida e inestable con un inconsciente', 'El tub de rescat és lleuger, flexible i el més versàtil; la boia torpede és rígida i inestable amb un inconscient', { ok: true }),
    O('La boya torpedo es la indicada en crisis convulsivas', 'La boia torpede és la indicada en crisis convulsives'),
    O('El aro salvavidas es blando y se usa en bandolera', 'El cercle salvavides és bla i s\'usa en bandolera'),
    O('El material solo se usa con víctimas inconscientes', 'El material només s\'usa amb víctimes inconscients')
  ], T('Salvamento C2: aro (rígido, con cabo), tubo (espuma, arnés en bandolera), boya torpedo (ABS, espacios naturales), tablero espinal.', 'Salvament C2: cercle (rígid, amb cap), tub (escuma, arnés en bandolera), boia torpede (ABS, espais naturals), tauler espinal.'), 'material'),

  Q(T('Entradas al agua: ¿cuál es correcta?', 'Entrades a l\'aigua: quina és correcta?'), [
    O('El picado no se hace en piscinas y la altura máxima de entrada es de 3 m', 'El picat no es fa en piscines i l\'altura màxima d\'entrada és de 3 m', { ok: true }),
    O('El picado es la entrada recomendada en piscinas', 'El picat és l\'entrada recomanada en piscines', { d: true }),
    O('Con aletas se entra echando el cuerpo hacia atrás', 'Amb aletes s\'entra tirant el cos cap arrere'),
    O('Desde cualquier altura si la zona es profunda', 'Des de qualsevol altura si la zona és profunda')
  ], T('Paso de gigante inclinado hacia delante sin perder el contacto visual; en agujero 2-3 m de altura y 2 m de profundidad mínima; carpado máximo 1 m.', 'Pas de gegant inclinat cap avant sense perdre el contacte visual; en forat 2-3 m d\'altura i 2 m de profunditat mínima; carpat màxim 1 m.'), 'rescate'),

  Q(T('La hidrocución es…', 'La hidrocució és…'), [
    O('Un síncope termodiferencial por entrada brusca en agua con diferencia de temperatura superior a 5 °C', 'Un síncope termodiferencial per entrada brusca en aigua amb diferència de temperatura superior a 5 °C', { ok: true }),
    O('Un corte de digestión por comer antes del baño', 'Un tall de digestió per menjar abans del bany'),
    O('Una electrocución en el agua', 'Una electrocució en l\'aigua'),
    O('El ahogamiento retardado', 'L\'ofegament retardat')
  ], T('Prevención: ducha progresiva y entrada gradual mojando brazos, piernas, abdomen, nuca y cabeza.', 'Prevenció: dutxa progressiva i entrada gradual mullant braços, cames, abdomen, nuca i cap.'), 'consciencia'),

  Q(T('¿Cuándo se puede suspender la RCP?', 'Quan es pot suspendre l\'RCP?'), [
    O('Cuando la víctima recupera funciones espontáneas, cuando te releva el equipo de reanimación avanzada o por agotamiento', 'Quan la víctima recupera funcions espontànies, quan et releva l\'equip de reanimació avançada o per esgotament', { ok: true }),
    O('A los 10 minutos si no responde', 'Als 10 minuts si no respon', { d: true }),
    O('Cuando llega el DESA', 'Quan arriba el DESA', { d: true }),
    O('Cuando aparecen signos de hipotermia', 'Quan apareixen signes d\'hipotèrmia', { d: true })
  ], T('U15: recuperación, relevo o agotamiento; en ahogado con hipotermia la RCP se prolonga.', 'U15: recuperació, relleu o esgotament; en ofegat amb hipotèrmia l\'RCP es prolonga.'), 'rcp'),

  Q(T('Cánula orofaríngea (Guedel):', 'Cànula orofaríngia (Guedel):'), [
    O('Se mide de la comisura labial al lóbulo de la oreja y solo se usa en inconscientes', 'Es mesura de la comissura labial al lòbul de l\'orella i només s\'usa en inconscients', { ok: true }),
    O('Previene la broncoaspiración y se usa en conscientes', 'Prevé la broncoaspiració i s\'usa en conscients'),
    O('Se mide de la nariz al mentón', 'Es mesura del nas al mentó'),
    O('Sustituye a la ventilación', 'Substituïx la ventilació')
  ], T('Mantiene la vía aérea permeable desplazando la lengua; se introduce con la curvatura hacia arriba y se gira 180° al llegar al paladar blando. No previene la broncoaspiración.', 'Manté la via aèria permeable desplaçant la llengua; s\'introduïx amb la curvatura cap amunt i es gira 180° en arribar al paladar bla. No prevé la broncoaspiració.'), 'instrumental'),

  Q(T('Dispositivo de oxigenación/ventilación para un paciente que NO respira:', 'Dispositiu d\'oxigenació/ventilació per a un pacient que NO respira:'), [
    O('Balón resucitador (Ambú) con mascarilla, con cánula de Guedel colocada antes', 'Baló resuscitador (Ambú) amb mascareta, amb cànula de Guedel col·locada abans', { ok: true }),
    O('Cánula nasal a 2 L/min', 'Cànula nasal a 2 L/min'),
    O('Mascarilla simple a 5 L/min', 'Mascareta simple a 5 L/min'),
    O('Mascarilla con reservorio: el paciente inspira solo', 'Mascareta amb reservori: el pacient inspira sol')
  ], T('Oxigenar (respira solo, aportas O₂) frente a ventilar (no respira, fuerzas la entrada de aire). Con reservorio y O₂ el Ambú llega al 100 %.', 'Oxigenar (respira sol, aportes O₂) enfront de ventilar (no respira, forces l\'entrada d\'aire). Amb reservori i O₂ l\'Ambú arriba al 100 %.'), 'instrumental'),

  Q(T('Legislación valenciana sobre botiquín y enfermería:', 'Legislació valenciana sobre farmaciola i infermeria:'), [
    O('Decreto 97/2000 (piscinas de uso colectivo) y Decreto 67/2020 (playas)', 'Decret 97/2000 (piscines d\'ús col·lectiu) i Decret 67/2020 (platges)', { ok: true }),
    O('Real Decreto 836/2012 regula las piscinas', 'Reial Decret 836/2012 regula les piscines'),
    O('No existe normativa autonómica', 'No existix normativa autonòmica'),
    O('Orden del 31 de mayo de 1960', 'Orde del 31 de maig de 1960')
  ], T('El RD 836/2012 regula las ambulancias; la Orden de 1960 creó la figura del "bañero".', 'El RD 836/2012 regula les ambulàncies; l\'Orde de 1960 va crear la figura del "banyero".'), 'legislacion'),

  Q(T('No socorrer a una persona desamparada en peligro grave (art. 195 del Código Penal) se castiga con…', 'No socórrer una persona desemparada en perill greu (art. 195 del Codi Penal) es castiga amb…'), [
    O('Multa de 3 a 12 meses; si el omitente causó el accidente, prisión de 6 meses a 4 años', 'Multa de 3 a 12 mesos; si qui omet va causar l\'accident, presó de 6 mesos a 4 anys', { ok: true }),
    O('Solo responsabilidad civil', 'Només responsabilitat civil'),
    O('Inhabilitación de 10 años', 'Inhabilitació de 10 anys'),
    O('No es delito si no eres sanitario', 'No és delicte si no eres sanitari')
  ], T('Art. 196: el profesional que deniegue asistencia, penas en su mitad superior más inhabilitación de 6 meses a 3 años.', 'Art. 196: el professional que denegue assistència, penes en la seua meitat superior més inhabilitació de 6 mesos a 3 anys.'), 'legislacion'),

  Q(T('Escala de Glasgow: una puntuación inferior a 8 indica…', 'Escala de Glasgow: una puntuació inferior a 8 indica…'), [
    O('Alteración grave de la consciencia (TCE grave 3-8)', 'Alteració greu de la consciència (TCE greu 3-8)', { ok: true }),
    O('Estado normal', 'Estat normal'),
    O('TCE leve', 'TCE lleu'),
    O('Que la víctima está alerta', 'Que la víctima està alerta')
  ], T('Apertura ocular (1-4) + verbal (1-5) + motora (1-6). Leve 14-15, moderado 9-13, grave 3-8.', 'Obertura ocular (1-4) + verbal (1-5) + motora (1-6). Lleu 14-15, moderat 9-13, greu 3-8.'), 'consciencia'),

  Q(T('Relleno capilar normal:', 'Reompliment capil·lar normal:'), [
    O('Menos de 2 segundos', 'Menys de 2 segons', { ok: true }),
    O('Menos de 5 segundos', 'Menys de 5 segons'),
    O('Entre 3 y 4 segundos', 'Entre 3 i 4 segons'),
    O('No se valora en primeros auxilios', 'No es valora en primers auxilis')
  ], T('Más de 2 segundos indica disminución del volumen circulante (hipovolemia, shock).', 'Més de 2 segons indica disminució del volum circulant (hipovolèmia, xoc).'), 'constantes'),

  Q(T('Tras un rescate con víctima consciente que ha tragado agua, ¿qué signos obligan a activar una evaluación sanitaria en las 24 horas siguientes?', 'Després d\'un rescat amb víctima conscient que ha engolit aigua, quins signes obliguen a activar una avaluació sanitària en les 24 hores següents?'), [
    O('Tos persistente, no recordar el incidente, somnolencia excesiva o cambios de comportamiento', 'Tos persistent, no recordar l\'incident, somnolència excessiva o canvis de comportament', { ok: true }),
    O('Ninguno: si respira, la intervención ha terminado', 'Cap: si respira, la intervenció ha acabat'),
    O('Solo si vuelve a entrar en el agua', 'Només si torna a entrar en l\'aigua'),
    O('Hambre y sed', 'Fam i set')
  ], T('U18.9: el ahogamiento retardado (distrés respiratorio) puede aparecer horas después; seguimiento durante 24 horas.', 'U18.9: l\'ofegament retardat (distrés respiratori) pot aparéixer hores després; seguiment durant 24 hores.'), 'ahogamiento'),

  Q(T('Síncope: actuación', 'Síncope: actuació'), [
    O('Tumbado con las piernas elevadas, vía aérea permeable, aflojar ropas y recuperación lenta y gradual', 'Gitat amb les cames elevades, via aèria permeable, afluixar robes i recuperació lenta i gradual', { ok: true }),
    O('Sentado con la cabeza entre las piernas y agua con azúcar inmediata', 'Assegut amb el cap entre les cames i aigua amb sucre immediata'),
    O('Levantarlo rápido para que circule la sangre', 'Alçar-lo ràpid perquè circule la sang'),
    O('Iniciar RCP', 'Iniciar RCP')
  ], T('U21: pérdida brusca de consciencia con recuperación espontánea; causas vasovagal, situacional, ortostática, cardiogénica.', 'U21: pèrdua brusca de consciència amb recuperació espontània; causes vasovagal, situacional, ortostàtica, cardiogènica.'), 'consciencia'),

  Q(T('Manta isotérmica: ¿qué cara va hacia fuera para conservar el calor de la víctima?', 'Manta isotèrmica: quina cara va cap a fora per a conservar la calor de la víctima?'), [
    O('La dorada', 'La daurada', { ok: true }),
    O('La plateada', 'La platejada'),
    O('Es indiferente', 'És indiferent'),
    O('Ninguna: la manta no conserva calor', 'Cap: la manta no conserva calor')
  ], T('Dorado = calor (hipotermia); plateado = frío (refleja el calor, golpe de calor).', 'Daurat = calor (hipotèrmia); platejat = fred (reflectix la calor, colp de calor).'), 'material'),

  Q(T('Parada cardiorrespiratoria de un adulto en tierra (sin ahogamiento). Tras comprobar que no respira:', 'Parada cardiorespiratòria d\'un adult en terra (sense ofegament). Després de comprovar que no respira:'), [
    O('Activar 112 y DESA, e iniciar RCP 30:2 de inmediato', 'Activar 112 i DESA, i iniciar RCP 30:2 immediatament', { ok: true }),
    O('5 insuflaciones de rescate y después 30:2', '5 insuflacions de rescat i després 30:2'),
    O('Colocar en PLS y esperar al DESA', 'Col·locar en PLS i esperar el DESA', { d: true }),
    O('Comprobar el pulso durante un minuto antes de comprimir', 'Comprovar el pols durant un minut abans de comprimir')
  ], T('Las 5 insuflaciones iniciales son específicas del ahogado y del niño; en el adulto no acuático, 30:2 directo.', 'Les 5 insuflacions inicials són específiques de l\'ofegat i del xiquet; en l\'adult no aquàtic, 30:2 directe.'), 'rcp')
];
