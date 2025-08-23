/**
 * TripConfig - Configuración Central del Viaje al Himalaya
 * 
 * Archivo de configuración central que contiene todos los datos del viaje
 * a Nepal y Bután. Este objeto actúa como la fuente única de verdad para
 * toda la información del viaje, incluyendo itinerario, presupuesto,
 * vuelos, clima, agencias y equipaje.
 * 
 * Estructura de datos:
 * - itineraryData: Array con todos los días del viaje (24 días)
 * - budgetData: Presupuesto categorizado con items detallados
 * - flightsData: Información de vuelos de ida y vuelta
 * - packingListData: Lista de equipaje por categorías
 * - placesByDay: Lugares de interés por día del itinerario
 * - weatherData: Información climática por fases del viaje
 * - weatherLocations: Datos climáticos detallados por ciudades
 * - agenciesData: Información de agencias y servicios
 * - calendarData: Getters para cálculos de fechas y estadísticas
 * 
 * @author Sistema de Viaje
 * @version 2.0.0
 * @since 2024
 */

export const tripConfig = {
    // Datos del itinerario
    itineraryData: [
        {
            "id": "day-1",
            "phase": "nepal",
            "country": "Nepal",
            "title": "Salida desde Madrid",
            "description": "El viaje comienza con el vuelo nocturno desde Madrid-Barajas (MAD) con destino a Katmandú.",
            "image": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
            
            "icon": "✈️",
            "planA": "Embarque en el vuelo nocturno de Qatar Airways. Acomódate para el primer trayecto largo hasta Doha. Cena y desayuno a bordo.",
            "planB": "Asegúrate de haber hecho el check-in online para elegir un buen asiento.",
            "consejo": "Usa un cojín de viaje y antifaz. Dormir en el primer vuelo es clave para combatir el jet lag.",
            "bocado": "Cena ligera antes de embarcar. En el avión, bebe mucha agua.",
            "accommodation": "Vuelo nocturno"
        },
        {
            "id": "day-2",
            "phase": "nepal",
            "country": "Nepal",
            "title": "Llegada a Katmandú",
            "description": "Llegada al aeropuerto, trámites de visado y traslado al hotel en Thamel para un primer contacto con la ciudad.",
            "image": "https://www.conmochila.com/wp-content/uploads/2019/12/thamel-kathmandu-01.jpg",
            "coords": [
                27.7172,
                85.324
            ],
            "icon": "🛬",
            "planA": "Llegada a KTM. Pasa por inmigración para obtener el visado on-arrival. Recoge tu equipaje y busca al representante del tour o toma un taxi prepago al hotel en Thamel. Check-in y tiempo para refrescarse.",
            "planB": "Si llegas con energía, da un primer paseo por las caóticas y fascinantes calles de Thamel para ubicarte. Para un respiro, visita el cercano Jardín de los Sueños.",
            "consejo": "Ten a mano 50 USD en efectivo para el visado de 30 días. El proceso en el aeropuerto es sencillo pero puede haber cola. Un taxi a Thamel cuesta entre 400-800 NPR.",
            "bocado": "Tu primer Dal Bhat. ¡El plato nacional! Pide uno en un restaurante local en Thamel.",
            "accommodation": "Hotel en Thamel"
        },
        {
            "id": "day-3",
            "phase": "nepal",
            "country": "Nepal",
            "title": "Plaza Durbar y Encuentro WeRoad",
            "description": "Mañana libre para explorar el corazón histórico de Katmandú, la Plaza Durbar, antes de unirte al grupo de WeRoad por la tarde para la cena de bienvenida.",
            "image": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            "coords": [
                27.7048,
                85.3074
            ],
            "icon": "🏛️",
            "planA": "Aprovecha la mañana para visitar la Plaza Durbar de Katmandú, Patrimonio de la Humanidad. Explora el Palacio Real de Hanuman Dhoka y busca a la diosa viviente en el Kumari Chowk. Por la tarde, check-in en el Hotel Manang o similar para el encuentro con el grupo WeRoad y la cena de bienvenida.",
            "planB": "Piérdete por los mercados de Asan Tole e Indra Chowk, cerca de la Plaza Durbar, para una inmersión total en la vida local antes de la tranquilidad del tour.",
            "consejo": "La entrada a la Plaza Durbar cuesta 1000 NPR y te permite acceder a varios templos y al museo del palacio. Guarda la entrada, te la pueden pedir.",
            "bocado": "Prueba un 'Lassi' en las tiendas especializadas cerca de Indra Chowk. Es una bebida de yogur refrescante, perfecta para una pausa.",
            "accommodation": "Hotel en Thamel"
        },
        {
            "id": "day-4",
            "phase": "nepal",
            "country": "Nepal",
            "title": "Rafting en el Trisuli y Llegada a Pokhara",
            "description": "Viaje por carretera hacia Pokhara con una parada para una emocionante sesión de rafting en el río Trisuli. Tarde en el tranquilo barrio tibetano.",
            "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            "coords": [
                28.2096,
                83.9856
            ],
            "icon": "🚣",
            "planA": "Salida temprano por carretera hacia Pokhara (aprox. 6 horas). Parada para una sesión de rafting en el río Trisuli. Llegada a Pokhara y check-in en el Hotel White Pearl o similar. Por la tarde, visita al barrio tibetano, con sus casas de colores, su templo y tiendas de artesanía. Atardecer paseando por Lakeside.",
            "planB": "Al llegar a Pokhara, alquila una barca en el lago Phewa y rema hasta el templo Tal Barahi, situado en una isla en medio del lago. Es una experiencia muy serena.",
            "consejo": "Para el rafting, no lleves nada de valor que no se pueda mojar. Te darán bolsas estancas para lo imprescindible. Lleva un cambio de ropa.",
            "bocado": "Cena en un restaurante en la orilla del lago (Lakeside) en Pokhara. Prueba un Thukpa, una sopa de fideos de origen tibetano, muy reconfortante.",
            "accommodation": "Hotel en Pokhara"
        },
        {
            "id": "day-5",
            "phase": "nepal",
            "country": "Nepal",
            "title": "Trekking a Ghandruk (1.940m)",
            "description": "Comienzo del trekking. Viaje en jeep y caminata de 5-6h (8 km) a través de selva y pueblos hasta el asentamiento Gurung de Ghandruk.",
            "image": "https://himalayan-masters.com/wp-content/uploads/2024/08/Gurung-Cottage-Ghandruk.webp",
            "coords": [
                28.375,
                83.81
            ],
            "icon": "🏔️",
            "planA": "Traslado en jeep hasta Landruk (aprox. 4h). Inicio de la caminata desde Jhinu Danda. La ruta pasa por Saulibazaar (parada para almorzar) y atraviesa senderos selváticos y pequeños pueblos. Llegada a Ghandruk por la tarde. Visita al museo local para entender la cultura Gurung. Noche en una pensión local.",
            "planB": "Charla con los locales en los pueblos que atravieses. Su hospitalidad es legendaria y te permitirá conocer de cerca su modo de vida.",
            "consejo": "La segunda parte de la ruta tiene muchas escaleras. Camina a tu propio ritmo ('bistari, bistari'). No es una carrera. Disfruta del paisaje.",
            "bocado": "Prueba el té de jengibre, limón y miel en uno de los lodges. Es reconfortante y se dice que ayuda con la altitud.",
            "accommodation": "Teahouse en Ghandruk"
        },
        {
            "id": "day-6",
            "phase": "nepal",
            "country": "Nepal",
            "title": "Trekking a Chhomrong (2.170m)",
            "description": "Segunda jornada de trekking (6-7h, 8 km) hasta Chhomrong, la puerta de entrada al Santuario del Annapurna, con vistas espectaculares.",
            "image": "https://media.istockphoto.com/id/1493335414/es/foto/hermosa-estupa-de-budismo-tibetano-en-el-pueblo-de-chhomrong-con-el-monte-annapurna-al-sur-en.jpg?s=612x612&w=0&k=20&c=A5-ydGKKdxpFmvEYeaNQeZvYtMIX59ue3a3yl_oE3H8=",
            "coords": [
                28.415,
                83.82
            ],
            "icon": "🏔️",
            "planA": "Desayuno con vistas. La ruta de hoy incluye un ascenso a Kimrung Danda para almorzar, seguido de un descenso hasta Chhomrong. Este pueblo es el último antes del Campo Base del Annapurna. Disfruta del atardecer sobre el Annapurna Sur y el Machhapuchhre. Noche en pensión local.",
            "planB": "Busca la 'German Bakery' de Chhomrong. Encontrar un pastel de chocolate o un apple crumble en medio de la montaña no tiene precio.",
            "consejo": "Las vistas del Annapurna Sur y Machhapuchhre desde Chhomrong al atardecer son espectaculares. Ten la cámara preparada.",
            "bocado": "Recarga energías con un plato de 'garlic soup' (sopa de ajo). Es un clásico del trekking para combatir el mal de altura y entrar en calor.",
            "accommodation": "Teahouse en Chhomrong"
        },
        {
            "id": "day-7",
            "phase": "nepal",
            "country": "Nepal",
            "title": "Aguas Termales y Regreso a Pokhara",
            "description": "Caminata corta de descenso (2-3h) para un baño en aguas termales en Jhimodanda y regreso en jeep a Pokhara.",
            "image": "https://cdn.getyourguide.com/img/tour/4d032f9b41e3de55b58794f65eafe292beea2718366b16bab7fb83cfa48b9144.jpg/68.jpg",
            "coords": [
                28.2096,
                83.9856
            ],
            "icon": "♨️",
            "planA": "Última etapa del trekking. Descenso hasta Jhimodanda. Tiempo para relajarse en las piscinas de aguas termales. Almuerzo y traslado en jeep de vuelta a Pokhara (pasando por Nayapul). Tarde libre para descansar o actividades opcionales.",
            "planB": "Si te sientes con adrenalina, la tarde en Pokhara es ideal para hacer parapente, una de las actividades estrella de la ciudad, con vistas increíbles del lago y las montañas.",
            "consejo": "Lleva bañador para las aguas termales. Es la mejor recompensa para los músculos después del trekking.",
            "bocado": "Celebra el fin del trekking con una pizza en Pokhara. Hay pizzerías sorprendentemente buenas como la de Roadhouse Cafe.",
            "accommodation": "Hotel en Pokhara"
        },
        {
            "id": "day-8",
            "phase": "nepal",
            "country": "Nepal",
            "title": "Parque Nacional de Chitwan",
            "description": "Viaje a la selva de Chitwan. Por la tarde, safari en jeep en busca de rinocerontes y otra fauna salvaje.",
            "image": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/16/ee/68/e7/chitwan-jungle-safari.jpg?w=1200&h=900&s=1",
            "coords": [
                27.5291,
                84.422
            ],
            "icon": "🐘",
            "planA": "Salida por carretera hacia el sur, a la región de Terai. Llegada al Parque Nacional de Chitwan. Por la tarde, primer safari en jeep por la jungla para avistar fauna, especialmente rinocerontes de un cuerno. Cena en el lodge junto al río Rapti.",
            "planB": "Paseo al atardecer por la orilla del río Rapti. Es muy relajante y se ven muchos pájaros y locales bañando a sus elefantes.",
            "consejo": "Usa ropa de colores neutros (verde, beige) para el safari y no te olvides del repelente de mosquitos. Mantén silencio para no asustar a los animales.",
            "bocado": "Prueba un curry de pescado fresco en algún restaurante cerca del río, es una especialidad de la zona.",
            "accommodation": "Lodge en Chitwan"
        },
        {
            "id": "day-9",
            "phase": "nepal",
            "country": "Nepal",
            "title": "Chitwan y Regreso a Katmandú",
            "description": "Actividad matutina en Chitwan (paseo en canoa o visita a un pueblo Tharu) y largo viaje de vuelta a Katmandú.",
            "image": "https://media.tacdn.com/media/attractions-splice-spp-674x446/07/9a/f2/ec.jpg",
            "coords": [
                27.7172,
                85.324
            ],
            "icon": "🚙",
            "planA": "Actividad matutina: paseo en canoa por el río Rapti para observar aves y cocodrilos gaviales. Desayuno y visita a un pueblo de la etnia Tharu para conocer su cultura única. Comienzo del viaje de regreso por carretera a Katmandú (aprox. 6 horas).",
            "planB": "El paseo en canoa por el río Rapti es muy recomendable al amanecer. La niebla matutina sobre el río crea una atmósfera mágica.",
            "consejo": "El viaje de vuelta puede ser largo y pesado. Ten a mano un libro o música para el trayecto. Compra algunos snacks locales para el camino.",
            "bocado": "Para cenar en Katmandú, busca un restaurante que sirva 'Chatamari', a menudo llamada la 'pizza nepalí', una fina crepe de arroz con toppings.",
            "accommodation": "Hotel en Katmandú"
        },
        {
            "id": "day-10",
            "phase": "nepal",
            "country": "Nepal",
            "title": "Katmandú: Cocina y Despedida",
            "description": "Día para explorar Katmandú de forma independiente, seguido de una clase de cocina nepalí y la cena de despedida del grupo.",
            "image": "https://almamochilera.com/images/blog/abhishek-sanwa-limbu-lr559dcst70-unsplash-compressor.jpg",
            "coords": [
                27.7172,
                85.324
            ],
            "icon": "🧑‍🍳",
            "planA": "Mañana libre para explorar Thamel, visitar el Jardín de los Sueños o hacer compras. Por la tarde, participación en una clase de cocina para aprender a preparar platos como los momos. Cena de despedida del grupo para compartir las experiencias.",
            "planB": "Visita el mercado de Asan Tole, a un corto paseo de Thamel. Es el mercado más antiguo y bullicioso de la ciudad, una experiencia sensorial auténtica.",
            "consejo": "En la clase de cocina, no tengas miedo de pringarte las manos. Hacer la masa de los momos es muy divertido y una habilidad que te llevarás a casa.",
            "bocado": "¡Los momos que tú mismo has preparado! Sin duda, la mejor cena de despedida.",
            "accommodation": "Hotel en Katmandú"
        },
        {
            "id": "day-11",
            "phase": "nepal",
            "country": "Nepal",
            "title": "Estupas Sagradas de Katmandú",
            "description": "Mañana de despedida del grupo y tarde libre para explorar dos de los lugares más sagrados del budismo en el valle: Swayambhunath y Boudhanath.",
            "image": "https://pasaportenomada.es/wp-content/uploads/2024/08/que-ver-en-katmandu-boudanath.webp",
            "coords": [
                27.7147,
                85.3445
            ],
            "icon": "☸️",
            "planA": "Desayuno y despedida del grupo WeRoad. Tarde libre. Toma un taxi a Swayambhunath (Templo de los Monos), sube sus 365 escalones y disfruta de las vistas panorámicas de la ciudad. Por la tarde-noche, visita la gran estupa de Boudhanath.",
            "planB": "Ve a la estupa de Boudhanath al atardecer. La atmósfera con los monjes y peregrinos dando vueltas (kora) mientras encienden lámparas de mantequilla es mágica.",
            "consejo": "Para visitar estos dos lugares, negocia un precio con un taxista para que te lleve a ambos y te espere. Ahorrarás tiempo y dinero.",
            "bocado": "Cena en una de las terrazas de los restaurantes que rodean la estupa de Boudhanath, con vistas a la cúpula iluminada.",
            "accommodation": "Hotel en Katmandú"
        },
        {
            "id": "day-12",
            "phase": "butan",
            "country": "Bután",
            "title": "Llegada a Bután y Capital Thimphu",
            "description": "Vuelo panorámico a Paro y traslado a la capital, Thimphu. Visita al Museo Nacional, al Buda Dordenma y al centro de tejido.",
            "image": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Buddha_Dordenma.jpg",
            "coords": [
                27.4728,
                89.639
            ],
            "icon": "✈️",
            "planA": "Traslado al aeropuerto para el espectacular vuelo a Paro. A la llegada, encuentro con el guía local. Visita al Museo Nacional (Ta Dzong) para una introducción a la historia de Bután. Traslado a Thimphu. Visita a la estatua del Buda Dordenma y al Weaving Center. Tarde libre para un primer paseo por la capital.",
            "planB": "Pide a tu guía parar en el mirador del río Chuzom, donde se unen los ríos de Paro y Thimphu, marcados por tres estupas de diferentes estilos.",
            "consejo": "¡Pide asiento de ventanilla en el lado izquierdo en el vuelo a Paro! Si el día está claro, verás el Everest.",
            "bocado": "Tu primera comida en Bután seguramente incluirá 'Ema Datshi' (chiles y queso). ¡Pide que no pique mucho al principio!",
            "accommodation": "Hotel en Thimphu"
        },
        {
            "id": "day-13",
            "phase": "butan",
            "country": "Bután",
            "title": "Arte y Cultura en Thimphu",
            "description": "Caminata al Monasterio de Tango y visita a los centros culturales de Thimphu: el Instituto Zorig Chusum, la Biblioteca Nacional y el Museo Postal.",
            "image": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/11/3e/05/86/tashichho-dzong-it-was.jpg?w=900&h=500&s=1",
            "coords": [
                27.578,
                89.636
            ],
            "icon": "🎨",
            "planA": "Por la mañana, caminata de 2.5h (ida y vuelta) al Monasterio de Tango. Almuerzo tradicional en el Folk Heritage Restaurant. Por la tarde, visita al Instituto Nacional Zorig Chusum (escuela de las 13 artes), la Biblioteca Nacional, el Authentic Craft Bazaar y el Museo Postal.",
            "planB": "Visita la Reserva de Takines para ver el curioso animal nacional de Bután y el Tashichho Dzong (Fortaleza de la Gloriosa Religión), sede del gobierno.",
            "consejo": "En el Museo Postal puedes imprimir un sello con tu propia foto. ¡El mejor y más original souvenir!",
            "bocado": "Prueba los 'momos' butaneses. Son similares a los nepalíes pero a menudo más picantes y con rellenos diferentes.",
            "accommodation": "Hotel en Thimphu"
        },
        {
            "id": "day-14",
            "phase": "butan",
            "country": "Bután",
            "title": "Hacia Punakha vía Dochula Pass",
            "description": "Viaje a Punakha a través del paso Dochula (3.150m). Visita al 'Templo de la Fertilidad' y al majestuoso Punakha Dzong.",
            "image": "https://www.authenticindiatours.com/app/uploads/2022/04/Monument-with-108-chorten-Dochula-Pass-Bhutan-min-1400x550-c-default.jpg",
            "coords": [
                27.5843,
                89.8631
            ],
            "icon": "🏯",
            "planA": "Salida hacia Punakha. Parada en el paso de Dochula para admirar las 108 estupas y las vistas del Himalaya. Descenso al valle y caminata hasta el Chimi Lhakhang, el 'Templo de la Fertilidad'. Por la tarde, visita al Punakha Dzong, situado en la confluencia de los ríos Phochu y Mochu.",
            "planB": "Cruza el puente colgante cerca del Punakha Dzong, uno de los más largos de Bután. ¡Las vistas y la sensación son geniales!",
            "consejo": "En el paso Dochula, si el día está despejado, la vista de la cordillera del Himalaya es sobrecogedora. Tómate tu tiempo y abrígate.",
            "bocado": "El arroz rojo es una especialidad de Bután. Lo servirán en casi todas las comidas, es nutritivo y tiene un sabor particular, a nuez.",
            "accommodation": "Hotel en Punakha"
        },
        {
            "id": "day-15",
            "phase": "butan",
            "country": "Bután",
            "title": "Valle de Punakha y Regreso a Paro",
            "description": "Caminata matutina al Khamsum Yuelley Namgyel Chorten y regreso por carretera a Paro, con una posible caminata adicional en ruta.",
            "image": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/17/1c/1e/22/khamsum-yulley-namgyal.jpg?w=1200&h=-1&s=1",
            "coords": [
                27.618,
                89.861
            ],
            "icon": "🚶‍♂️",
            "planA": "Caminata matutina de 2.5h a través de campos de arroz hasta el Khamsum Yuelley Namgyel Chorten. Disfruta de las vistas del valle. Viaje de regreso a Paro, con almuerzo en el Dochula Cafe. Por la tarde, caminata opcional de 1h al monasterio Tashigang Gonpa desde el paso.",
            "planB": "Pide a tu guía que te cuente la historia del 'Divino Loco', Drukpa Kunley, asociada al Templo de la Fertilidad. Es muy curiosa y fundamental para entender parte de la cultura butanesa.",
            "consejo": "La caminata al Chorten es suave y muy fotogénica, atravesando campos de arroz y un puente colgante. Un paseo muy agradable.",
            "bocado": "Prueba el 'Suja', el té de mantequilla butanés. Es una bebida de sabor fuerte y salado, una experiencia cultural en sí misma.",
            "accommodation": "Hotel en Paro"
        },
        {
            "id": "day-16",
            "phase": "butan",
            "country": "Bután",
            "title": "Trekking al Nido del Tigre",
            "description": "Día dedicado al trekking al icónico Monasterio de Taktsang, el 'Nido del Tigre', y cena de despedida en una granja local.",
            "image": "https://www.earthtrekkers.com/wp-content/uploads/2017/02/Tigers-Nest-Bhutan.jpg.webp",
            "coords": [
                27.4915,
                89.3632
            ],
            "icon": "🐅",
            "planA": "Día cumbre en Bután. Desayuno temprano y trekking al Monasterio de Taktsang (4-5h ida y vuelta). Visita al monasterio. Descenso y almuerzo. Tarde libre. Cena de despedida en una granja local con opción de baño de piedras calientes.",
            "planB": "Si te quedan fuerzas, visita el Kyichu Lhakhang por la tarde, uno de los templos más antiguos y sagrados de Bután, para una experiencia más tranquila y espiritual.",
            "consejo": "Empieza a caminar antes de las 8 am para evitar multitudes y el calor. El camino es empinado, usa bastones si lo necesitas. Viste con decoro (mangas y pantalones largos).",
            "bocado": "La comida en la cafetería a mitad de camino del Nido del Tigre tiene las mejores vistas del mundo. Para la cena, prueba el 'Phaksha Paa' (cerdo con chiles).",
            "accommodation": "Hotel en Paro"
        },
        {
            "id": "day-17",
            "phase": "farewell",
            "country": "Nepal",
            "title": "Joyas de Patan y Despedida",
            "description": "Llegada a Katmandú por la mañana y tarde libre para explorar la ciudad de Patan, conocida por su exquisita Plaza Durbar y su Templo Dorado.",
            "image": "https://upload.wikimedia.org/wikipedia/commons/4/48/Patan-Palastplatz-14-Tauben-2013-gje.jpg",
            "coords": [
                27.6736,
                85.325
            ],
            "icon": "🏛️",
            "planA": "Llegada al aeropuerto de Katmandú a las 9am y traslado al hotel. Por la tarde, visita la Plaza Durbar de Patan, a menudo considerada la más bella del valle. No te pierdas el increíble Museo de Patan y el cercano Templo Dorado.",
            "planB": "En Patan, piérdete por los patios interiores (bahals) que rodean la plaza. Descubrirás pequeños santuarios, talleres de artesanos y una vida local muy tranquila.",
            "consejo": "En el vuelo de Paro a Katmandú, pide ventanilla en el lado derecho para volver a ver el Himalaya.",
            "bocado": "Disfruta de una última cena nepalí en un buen restaurante de Patan o Thamel. Prueba la cocina Newari, como la 'choyla' o el 'yomari'.",
            "accommodation": "Hotel en Katmandú"
        },
        {
            "id": "day-18",
            "phase": "farewell",
            "country": "Bután",
            "title": "Vuelo de Vuelta a Casa",
            "description": "Desayuno y traslado al aeropuerto para el vuelo de regreso, lleno de recuerdos del Himalaya.",
            "image": "https://media.istockphoto.com/id/1465916031/es/foto/el-camino-al-avi%C3%B3n.jpg?s=612x612&w=0&k=20&c=h7qjRLIKPBelNG5e3PP6fje3D9pOxvYDHN1hoQLZHms=",
            "coords": [
                27.6966,
                85.3533
            ],
            "icon": "🏠",
            "planA": "Desayuno en el hotel. Dependiendo de la hora del vuelo, tiempo para un último paseo por Thamel. Traslado al Aeropuerto Internacional Tribhuvan para el vuelo de regreso a casa.",
            "planB": "Si tienes tiempo, compra té nepalí de buena calidad en alguna tienda especializada. Es un gran recuerdo y regalo.",
            "consejo": "Llega al aeropuerto con bastante antelación. El proceso de facturación y seguridad en Katmandú puede ser lento.",
            "bocado": "Un último café nepalí en el aeropuerto mientras esperas el embarque.",
            "accommodation": "Vuelo de regreso"
        }
    ],

    // Datos del presupuesto
    budgetData: {
        "budgetData": {
            "Transporte": [
                {
                    "concept": "Vuelos Principales",
                    "cost": 693.97,
                    "category": "Transporte",
                    "phase": "general",
                    "subItems": [
                        {
                            "concept": "Madrid ↔ Katmandú (Qatar)",
                            "cost": 270.00
                        },
                        {
                            "concept": "Katmandú → Paro (Drukair)",
                            "cost": 227.76
                        },
                        {
                            "concept": "Paro → Katmandú (Bhutan Airlines)",
                            "cost": 196.21
                        }
                    ]
                },
                {
                    "concept": "Transporte Local (Katmandú)",
                    "cost": 41.00,
                    "category": "Transporte",
                    "phase": "nepal",
                    "country": "Nepal",
                    "subItems": [
                        {
                            "concept": "Taxis Aeropuerto (4 viajes)",
                            "cost": 28.00
                        },
                        {
                            "concept": "Taxis Ciudad (4 viajes)",
                            "cost": 12.00
                        },
                        {
                            "concept": "Autobuses (2 viajes)",
                            "cost": 1.00
                        }
                    ]
                }
            ],
            "Tour": [
                {
                    "concept": "Itinerario \"Nepal 360\"",
                    "cost": 1100.00,
                    "category": "Tour",
                    "phase": "nepal",
                    "country": "Nepal"
                },
                {
                    "concept": "Itinerario \"Best of Bhutan\"",
                    "cost": 1602.00,
                    "category": "Tour",
                    "phase": "butan",
                    "country": "Bután"
                }
            ],
            "Comida y Bebida": [
                {
                    "concept": "Comidas en Nepal",
                    "cost": 187.00,
                    "category": "Comida y Bebida",
                    "phase": "nepal",
                    "country": "Nepal"
                },
                {
                    "concept": "Bebidas",
                    "cost": 45.00,
                    "category": "Comida y Bebida",
                    "phase": "butan",
                    "country": "Bután"
                }
            ],
            "Entradas y Visados": [
                {
                    "concept": "Visados y Entradas",
                    "cost": 68.50,
                    "category": "Entradas y Visados",
                    "phase": "nepal",
                    "country": "Nepal",
                    "subItems": [
                        {
                            "concept": "Visado de Nepal (30 días)",
                            "cost": 50.00
                        },
                        {
                            "concept": "Plaza Durbar, Katmandú",
                            "cost": 7.00
                        },
                        {
                            "concept": "Swayambhunath (Templo de los Monos)",
                            "cost": 1.50
                        },
                        {
                            "concept": "Pashupatinath",
                            "cost": 7.00
                        },
                        {
                            "concept": "Estupa de Boudhanath",
                            "cost": 3.00
                        }
                    ]
                },
                {
                    "concept": "Entradas a Monumentos",
                    "cost": 77.00,
                    "category": "Entradas y Visados",
                    "phase": "butan",
                    "country": "Bután",
                    "subItems": [
                        {
                            "concept": "Monasterio Taktsang (Nido del Tigre)",
                            "cost": 22.00
                        },
                        {
                            "concept": "Tashichho Dzong",
                            "cost": 11.00
                        },
                        {
                            "concept": "Punakha Dzong",
                            "cost": 11.00
                        },
                        {
                            "concept": "Memorial Chorten",
                            "cost": 11.00
                        },
                        {
                            "concept": "Buddha Dordenma",
                            "cost": 11.00
                        },
                        {
                            "concept": "Rinpung Dzong",
                            "cost": 11.00
                        }
                    ]
                }
            ],
            "Varios": [
                {
                    "concept": "Gastos Varios y Propinas (Nepal)",
                    "cost": 216.50,
                    "category": "Varios",
                    "phase": "nepal",
                    "country": "Nepal",
                    "subItems": [
                        {
                            "concept": "Propinas",
                            "cost": 55.00
                        },
                        {
                            "concept": "Fondo Común Estimado",
                            "cost": 50.00
                        },
                        {
                            "concept": "Parapente en Pokhara (Opcional)",
                            "cost": 80.00
                        },
                        {
                            "concept": "Comunicaciones (SIM)",
                            "cost": 4.00
                        },
                        {
                            "concept": "Souvenirs",
                            "cost": 22.50
                        },
                        {
                            "concept": "Lavandería",
                            "cost": 5.00
                        }
                    ]
                },
                {
                    "concept": "Gastos Varios y Propinas (Bután)",
                    "cost": 116.50,
                    "category": "Varios",
                    "phase": "butan",
                    "country": "Bután",
                    "subItems": [
                        {
                            "concept": "Propinas Guía y Conductor",
                            "cost": 90.00
                        },
                        {
                            "concept": "Comunicaciones (SIM)",
                            "cost": 4.00
                        },
                        {
                            "concept": "Souvenirs",
                            "cost": 22.50
                        }
                    ]
                }
            ],
            "Contingencia": [
                {
                    "concept": "Fondo para Imprevistos (Nepal)",
                    "cost": 149.20,
                    "category": "Contingencia",
                    "phase": "nepal",
                    "country": "Nepal"
                },
                {
                    "concept": "Fondo para Imprevistos (Bután)",
                    "cost": 176.35,
                    "category": "Contingencia",
                    "phase": "butan",
                    "country": "Bután"
                }
            ]
        }
    },

    // Datos del clima
    weatherData: [
        {
            location: 'Kathmandu',
            dayTemp: 25,
            nightTemp: 15,
            description: 'Soleado con nubes ocasionales',
            icon: '☀️'
        },
        {
            location: 'Pokhara',
            dayTemp: 28,
            nightTemp: 18,
            description: 'Cálido y húmedo',
            icon: '🌤️'
        },
        {
            location: 'Thimphu',
            dayTemp: 22,
            nightTemp: 12,
            description: 'Fresco y agradable',
            icon: '🌥️'
        },
        {
            location: 'Paro',
            dayTemp: 20,
            nightTemp: 10,
            description: 'Frío por la mañana',
            icon: '❄️'
        }
    ],

    // Lista de equipaje
    packingListData: {
        'Ropa': [
            'Camisetas de manga larga (5-7)',
            'Pantalones de trekking (3-4)',
            'Chaleco o chaqueta ligera',
            'Ropa interior térmica',
            'Calcetines de trekking (5-7 pares)',
            'Gorros de lana (2)',
            'Guantes de trekking',
            'Bufanda o pañuelo'
        ],
        'Calzado': [
            'Botas de trekking',
            'Zapatillas deportivas',
            'Sandalias para el hotel',
            'Calcetines de repuesto'
        ],
        'Equipo': [
            'Mochila de 30-40L',
            'Mochila pequeña para excursiones',
            'Botella de agua 1L',
            'Linterna frontal',
            'Bastones de trekking',
            'Gafas de sol',
            'Protector solar SPF 50+',
            'Crema hidratante',
            'Kit de primeros auxilios',
            'Cámara fotográfica',
            'Power bank',
            'Adaptadores de corriente'
        ],
        'Documentos y Salud': [
            'Pasaporte válido',
            'Visas (Nepal y Bután)',
            'Seguro de viaje',
            'Tarjetas de crédito/débito',
            'Efectivo en dólares/euros',
            'Medicamentos personales',
            'Pastillas para el mal de altura',
            'Repelente de mosquitos',
            'Toallitas húmedas',
            'Papel higiénico'
        ]
    },

    // Lugares por día
    placesByDay: {
        'day-1': [
            { name: 'Aeropuerto de Madrid-Barajas (MAD)', coords: [40.4936, -3.5668], icon: '✈️', description: 'Punto de partida del viaje' }
        ],
        'day-2': [
            { name: 'Aeropuerto Internacional Tribhuvan (KTM)', coords: [27.6966, 85.3533], icon: '🛬', description: 'Punto de llegada a Nepal' },
            { name: 'Thamel', coords: [27.7172, 85.3138], icon: '🛍️', description: 'Barrio turístico y centro neurálgico' },
            { name: 'Jardín de los Sueños', coords: [27.7172, 85.3150], icon: '🌳', description: 'Oasis de paz de estilo neoclásico' }
        ],
        'day-3': [
            { name: 'Plaza Durbar de Katmandú', coords: [27.7048, 85.3074], icon: '🏛️', description: 'Corazón histórico y Patrimonio UNESCO' },
            { name: 'Kumari Chowk', coords: [27.7045, 85.3065], icon: '🙏', description: 'Residencia de la diosa viviente' },
            { name: 'Asan Tole', coords: [27.708, 85.311], icon: '🌶️', description: 'Mercado local auténtico y bullicioso' },
            { name: 'Hotel Manang (o similar)', coords: [27.7172, 85.3138], icon: '🏨', description: 'Punto de encuentro WeRoad' }
        ],
        'day-4': [
            { name: 'Río Trisuli', coords: [27.87, 84.76], icon: '🚣', description: 'Rafting de aguas bravas' },
            { name: 'Pokhara', coords: [28.2096, 83.9856], icon: '🏞️', description: 'Ciudad a orillas del lago Phewa' },
            { name: 'Barrio Tibetano (Pokhara)', coords: [28.216, 83.96], icon: '🏘️', description: 'Asentamiento con templo y artesanía' },
            { name: 'Lago Phewa', coords: [28.2096, 83.9856], icon: '⛵', description: 'Vistas al Annapurna y Templo Tal Barahi' }
        ],
        'day-5': [
            { name: 'Ghandruk', coords: [28.375, 83.81], icon: '🏔️', description: 'Pueblo Gurung a 1.940m' },
            { name: 'Museo Gurung (Ghandruk)', coords: [28.375, 83.81], icon: '🏛️', description: 'Cultura e historia local' }
        ],
        'day-6': [
            { name: 'Chhomrong', coords: [28.415, 83.82], icon: '🏔️', description: 'Puerta del Santuario del Annapurna (2.170m)' },
            { name: 'Annapurna Sur (vista)', coords: [28.52, 83.81], icon: '⛰️', description: 'Pico de 7.219m' },
            { name: 'Machhapuchhre (vista)', coords: [28.49, 83.94], icon: '⛰️', description: 'Montaña sagrada \'Cola de Pez\' (6.993m)' }
        ],
        'day-7': [
            { name: 'Aguas Termales de Jhimodanda', coords: [28.33, 83.80], icon: '♨️', description: 'Piscinas naturales para relajación muscular' },
            { name: 'Pokhara', coords: [28.2096, 83.9856], icon: '🏞️', description: 'Regreso a la ciudad base del trekking' }
        ],
        'day-8': [
            { name: 'Parque Nacional de Chitwan', coords: [27.5291, 84.4220], icon: '🐘', description: 'Safari en busca de rinocerontes' },
            { name: 'Río Rapti', coords: [27.57, 84.49], icon: '🌊', description: 'Paseos al atardecer y canoas' }
        ],
        'day-9': [
            { name: 'Pueblo Tharu (Chitwan)', coords: [27.57, 84.49], icon: '🏘️', description: 'Cultura indígena de la región de Terai' },
            { name: 'Katmandú', coords: [27.7172, 85.3240], icon: '🏙️', description: 'Regreso a la capital' }
        ],
        'day-10': [
            { name: 'Thamel', coords: [27.7172, 85.3138], icon: '🛍️', description: 'Compras, exploración y clase de cocina' },
            { name: 'Jardín de los Sueños', coords: [27.7172, 85.3150], icon: '🌳', description: 'Oasis de paz (opcional)' }
        ],
        'day-11': [
            { name: 'Swayambhunath Stupa (Templo de los Monos)', coords: [27.7147, 85.2903], icon: '🐒', description: 'Estupa sagrada con vistas panorámicas' },
            { name: 'Boudhanath Stupa', coords: [27.7215, 85.3615], icon: '☸️', description: 'La estupa más grande de Nepal' }
        ],
        'day-12': [
            { name: 'Aeropuerto Internacional de Paro (PBH)', coords: [27.4032, 89.4246], icon: '✈️', description: 'Llegada a Bután' },
            { name: 'Museo Nacional de Bután', coords: [27.4287, 89.4265], icon: '🏛️', description: 'Historia y cultura en la atalaya Ta Dzong' },
            { name: 'Buda Dordenma', coords: [27.443, 89.637], icon: '🙏', description: 'Estatua gigante con vistas a Thimphu' }
        ],
        'day-13': [
            { name: 'Monasterio de Tango', coords: [27.578, 89.636], icon: '🏯', description: 'Caminata espiritual' },
            { name: 'Instituto Nacional Zorig Chusum', coords: [27.48, 89.63], icon: '🎨', description: 'Escuela de las 13 artes de Bután' },
            { name: 'Museo Postal de Bután', coords: [27.47, 89.63], icon: '📮', description: 'Crea tu propio sello postal' },
            { name: 'Tashichho Dzong', coords: [27.4897, 89.6350], icon: '🏛️', description: 'Sede del gobierno y cuerpo monástico' }
        ],
        'day-14': [
            { name: 'Paso Dochula', coords: [27.492, 89.744], icon: '🏔️', description: '108 estupas y vistas del Himalaya' },
            { name: 'Chimi Lhakhang', coords: [27.57, 89.83], icon: '❤️', description: 'Templo de la Fertilidad' },
            { name: 'Punakha Dzong', coords: [27.5843, 89.8631], icon: '🏯', description: 'Palacio de la Gran Felicidad' },
            { name: 'Puente Colgante de Punakha', coords: [27.58, 89.86], icon: '🌉', description: 'Uno de los más largos de Bután' }
        ],
        'day-15': [
            { name: 'Khamsum Yuelley Namgyel Chorten', coords: [27.618, 89.861], icon: '🏯', description: 'Chorten sagrado con vistas al valle' }
        ],
        'day-16': [
            { name: 'Monasterio de Taktsang (Nido del Tigre)', coords: [27.4915, 89.3632], icon: '🐅', description: 'El icono sagrado de Bután' },
            { name: 'Kyichu Lhakhang', coords: [27.4411, 89.3764], icon: '🏛️', description: 'Uno de los templos más antiguos de Bután' }
        ],
        'day-17': [
            { name: 'Plaza Durbar de Patan', coords: [27.6736, 85.3250], icon: '🏛️', description: 'Patrimonio UNESCO, la \'Ciudad de la Belleza\'' },
            { name: 'Museo de Patan', coords: [27.6736, 85.3250], icon: '🏺', description: 'Considerado uno de los mejores de Asia' },
            { name: 'Templo Dorado (Hiranya Varna Mahavihar)', coords: [27.675, 85.323], icon: '✨', description: 'Monasterio budista del siglo XII' }
        ],
        'day-18': [
            { name: 'Aeropuerto Internacional Tribhuvan (KTM)', coords: [27.6966, 85.3533], icon: '✈️', description: 'Punto de partida final' }
        ]
    },

    // Datos del calendario
    calendarData: {
        // La fecha de inicio se calcula dinámicamente basándose en los datos del itinerario
        get startDate() {
            // Buscar el primer día del viaje (day-1) y extraer la fecha
            const firstDay = tripConfig.itineraryData.find(day => day.id === 'day-1');
            if (firstDay && firstDay.date) {
                return firstDay.date;
            }
            // Si no hay fecha específica, usar una fecha por defecto (se puede ajustar)
            return '2024-10-01';
        },
        getTotalDays() {
            return tripConfig.itineraryData.length;
        },
        getTotalCountries() {
            // Obtener países únicos de los datos del itinerario
            const countries = new Set();
            tripConfig.itineraryData.forEach(day => {
                if (day.country) {
                    countries.add(day.country);
                }
            });
            return countries.size;
        }
    },

    // Datos de vuelos
    flightsData: [
        { 
            type: 'Internacional', 
            title: 'Vuelo de Ida', 
            airline: 'Qatar Airways', 
            segments: [ 
                { 
                    from: 'MAD', 
                    fromDateTime: '9 de Octubre 22:45', 
                    to: 'DOH', 
                    toDateTime: '10 de Octubre 06:30', 
                    layover: 'Tránsito de 2h 55m en Doha (DOH)' 
                }, 
                { 
                    from: 'DOH', 
                    fromDateTime: '10 de Octubre 09:25', 
                    to: 'KTM', 
                    toDateTime: '10 de Octubre 16:45' 
                } 
            ] 
        },
        { 
            type: 'Regional', 
            title: 'Katmandú → Paro', 
            airline: 'Druk Air', 
            segments: [
                { 
                    from: 'KTM', 
                    fromDateTime: '20 de Octubre 09:10', 
                    to: 'PBH', 
                    toDateTime: '20 de Octubre 10:30' 
                }
            ] 
        },
        { 
            type: 'Regional', 
            title: 'Paro → Katmandú', 
            airline: 'Bhutan Airlines', 
            segments: [
                { 
                    from: 'PBH', 
                    fromDateTime: '25 de Octubre 07:05', 
                    to: 'KTM', 
                    toDateTime: '25 de Octubre 08:00' 
                }
            ] 
        },
        { 
            type: 'Internacional', 
            title: 'Vuelo de Vuelta', 
            airline: 'Qatar Airways', 
            segments: [ 
                { 
                    from: 'KTM', 
                    fromDateTime: '26 de Octubre 09:35', 
                    to: 'DOH', 
                    toDateTime: '26 de Octubre 12:25', 
                    layover: 'Tránsito de 2h 55m en Doha (DOH)' 
                }, 
                { 
                    from: 'DOH', 
                    fromDateTime: '26 de Octubre 15:20', 
                    to: 'MAD', 
                    toDateTime: '26 de Octubre 20:55' 
                } 
            ] 
        }
    ],

    // Datos del clima por fase del viaje
    weatherData: {
        nepal: {
            temperature: '22°C',
            condition: 'Templado',
            icon: 'wb_sunny',
            description: 'Clima templado y soleado, ideal para trekking'
        },
        butan: {
            temperature: '18°C', 
            condition: 'Fresco',
            icon: 'partly_cloudy_day',
            description: 'Clima fresco de montaña, perfecto para explorar'
        }
    },

    // Información climática detallada por ubicaciones
    weatherLocations: [
        { location: 'Katmandú', dayTemp: '22-25°C', nightTemp: '5-10°C', icon: 'location_city', color: 'text-blue-600' }, 
        { location: 'Pokhara', dayTemp: '22-25°C', nightTemp: '5-10°C', icon: 'landscape', color: 'text-green-600' },
        { location: 'Chitwan', dayTemp: '25-30°C', nightTemp: '15-20°C', icon: 'wb_sunny', color: 'text-orange-600' }, 
        { location: 'Thimphu', dayTemp: '15-22°C', nightTemp: '0-7°C', icon: 'terrain', color: 'text-slate-600' },
        { location: 'Paro', dayTemp: '15-22°C', nightTemp: '0-7°C', icon: 'terrain', color: 'text-slate-600' }, 
        { location: 'Punakha', dayTemp: '18-25°C', nightTemp: '10-15°C', icon: 'landscape', color: 'text-green-600' }
    ],

    // Información de agencias y servicios
    agenciesData: {
        weroad: {
            name: 'WeRoad - Nepal',
            icon: 'groups',
            color: 'text-green-600 dark:text-green-400',
            tour: 'Nepal 360',
            website: 'www.weroad.es',
            description: 'Grupo de viajeros jóvenes'
        },
        bhutan: {
            name: 'Best of Bhutan',
            icon: 'temple_buddhist', 
            color: 'text-orange-600 dark:text-orange-400',
            tour: 'Best of Bhutan',
            description: 'Agencia local especializada',
            contact: 'Por definir'
        },
        insurance: {
            name: 'Seguro de Viaje',
            icon: 'security',
            color: 'text-purple-600 dark:text-purple-400',
            status: 'pending',
            description: 'Información del seguro pendiente de añadir'
        },
        emergency: {
            name: 'Información Importante',
            icon: 'info',
            color: 'text-red-600 dark:text-red-400',
            embassy: 'Embajada España Nepal: +977 1 4123789',
            hospital: 'CIWEC Clinic, Katmandú',
            timezone: 'Nepal: UTC+5:45 | Bután: UTC+6:00'
        }
    }
};
