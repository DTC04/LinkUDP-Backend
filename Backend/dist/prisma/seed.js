"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const faker_1 = require("@faker-js/faker");
const fs = require("fs");
const path = require("path");
const prisma = new client_1.PrismaClient();
function capitalize(str) {
    return str.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
}
function getSubjectAreaFromName(courseName) {
    const lowerCaseName = courseName.toLowerCase();
    if (lowerCaseName.includes('cálculo') ||
        lowerCaseName.includes('álgebra') ||
        lowerCaseName.includes('ecuaciones'))
        return 'Matemáticas';
    if (lowerCaseName.includes('programación') ||
        lowerCaseName.includes('datos') ||
        lowerCaseName.includes('software') ||
        lowerCaseName.includes('computadores') ||
        lowerCaseName.includes('sistemas operativos') ||
        lowerCaseName.includes('redes'))
        return 'Informática';
    if (lowerCaseName.includes('física') ||
        lowerCaseName.includes('mecánica') ||
        lowerCaseName.includes('termodinámica') ||
        lowerCaseName.includes('electricidad') ||
        lowerCaseName.includes('ondas'))
        return 'Física';
    if (lowerCaseName.includes('química'))
        return 'Química';
    if (lowerCaseName.includes('economía') ||
        lowerCaseName.includes('finanzas') ||
        lowerCaseName.includes('contabilidad'))
        return 'Economía y Finanzas';
    if (lowerCaseName.includes('estadística') ||
        lowerCaseName.includes('probabilidades'))
        return 'Estadística';
    if (lowerCaseName.includes('inglés'))
        return 'Idiomas';
    if (lowerCaseName.includes('proyecto') || lowerCaseName.includes('taller'))
        return 'Proyectos y Talleres';
    if (lowerCaseName.includes('industrial') ||
        lowerCaseName.includes('operaciones') ||
        lowerCaseName.includes('logística') ||
        lowerCaseName.includes('gestión'))
        return 'Ingeniería Industrial';
    if (lowerCaseName.includes('civil') ||
        lowerCaseName.includes('estructural') ||
        lowerCaseName.includes('hormigón') ||
        lowerCaseName.includes('suelos') ||
        lowerCaseName.includes('hidráulica') ||
        lowerCaseName.includes('ambiental') ||
        lowerCaseName.includes('edificación'))
        return 'Ingeniería Civil';
    return 'General';
}
async function seedCoursesAndTutorsFromOutputJson(createdCoursesMap, createdTutorsMap) {
    const outputPath = path.join(__dirname, '..', 'output.json');
    if (!fs.existsSync(outputPath)) {
        console.log('output.json not found. Skipping seeding from JSON.');
        return false;
    }
    let jsonData = [];
    try {
        const fileContent = fs.readFileSync(outputPath, 'utf-8');
        jsonData = JSON.parse(fileContent);
        console.log('Successfully read and parsed output.json.');
    }
    catch (error) {
        console.error('Error reading or parsing output.json:', error);
        return false;
    }
    for (const item of jsonData) {
        const courseName = capitalize(item.NOMBRE);
        const professorName = item['Profesor(a)'];
        if (professorName.toLowerCase() === 'por definir') {
            console.log(`Skipping course "${courseName}" from output.json because professor is "por definir".`);
            continue;
        }
        let course = createdCoursesMap.get(courseName);
        if (!course) {
            const subjectArea = getSubjectAreaFromName(courseName);
            try {
                course = await prisma.course.upsert({
                    where: { name: courseName },
                    update: { subject_area: subjectArea },
                    create: { name: courseName, subject_area: subjectArea },
                });
                createdCoursesMap.set(courseName, course);
                console.log(`Upserted course from JSON: ${course.name}`);
            }
            catch (e) {
                console.error(`Error upserting course ${courseName} from JSON:`, e);
                continue;
            }
        }
        let tutorData = createdTutorsMap.get(professorName);
        if (!tutorData) {
            try {
                const userEmail = `${professorName
                    .toLowerCase()
                    .replace(/\s+/g, '.')
                    .replace(/[^a-z0-9.]/gi, '')}@exampleudp.com`;
                let user = await prisma.user.findUnique({
                    where: { email: userEmail },
                });
                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            full_name: professorName,
                            email: userEmail,
                            password: faker_1.fakerES.internet.password(),
                            role: client_1.Role.BOTH,
                            photo_url: faker_1.fakerES.image.avatar(),
                            email_verified: true,
                        },
                    });
                }
                let tutorProfile = await prisma.tutorProfile.findUnique({
                    where: { userId: user.id },
                });
                if (!tutorProfile) {
                    tutorProfile = await prisma.tutorProfile.create({
                        data: {
                            userId: user.id,
                            bio: faker_1.fakerES.lorem.paragraph(),
                            average_rating: parseFloat(faker_1.fakerES.number
                                .float({ min: 3.5, max: 5, fractionDigits: 1 })
                                .toFixed(1)),
                        },
                    });
                }
                tutorData = { user, profile: tutorProfile };
                createdTutorsMap.set(professorName, tutorData);
                console.log(`Upserted tutor from JSON: ${user.full_name}`);
            }
            catch (e) {
                console.error(`Error upserting tutor ${professorName} from JSON:`, e);
                continue;
            }
        }
        if (course && tutorData) {
            try {
                await prisma.tutorCourse.upsert({
                    where: {
                        tutorId_courseId: {
                            tutorId: tutorData.profile.id,
                            courseId: course.id,
                        },
                    },
                    update: {},
                    create: {
                        tutorId: tutorData.profile.id,
                        courseId: course.id,
                        level: faker_1.fakerES.helpers.arrayElement([
                            'Básico',
                            'Intermedio',
                            'Avanzado',
                        ]),
                        grade: parseFloat(faker_1.fakerES.number
                            .float({ min: 4.0, max: 7.0, fractionDigits: 1 })
                            .toFixed(1)),
                    },
                });
            }
            catch (e) {
                console.error(`Error upserting TutorCourse for ${tutorData.user.full_name} and ${course.name}:`, e);
            }
        }
    }
    return true;
}
async function ensureRandomCoursesAndTutors(minCourses, minTutors, createdCoursesMap, createdTutorsMap) {
    let coursesToCreate = minCourses - createdCoursesMap.size;
    if (coursesToCreate > 0) {
        console.log(`Need to create ${coursesToCreate} additional random courses.`);
        for (let i = 0; i < coursesToCreate; i++) {
            const courseName = capitalize(faker_1.fakerES.lorem.words(faker_1.fakerES.number.int({ min: 2, max: 4 })));
            if (!createdCoursesMap.has(courseName)) {
                const subjectArea = getSubjectAreaFromName(courseName);
                try {
                    const course = await prisma.course.create({
                        data: { name: courseName, subject_area: subjectArea },
                    });
                    createdCoursesMap.set(courseName, course);
                    console.log(`Created random course: ${course.name}`);
                }
                catch (e) {
                    console.warn(`Could not create random course ${courseName}: ${e.message}`);
                }
            }
        }
    }
    let tutorsToCreate = minTutors - createdTutorsMap.size;
    if (tutorsToCreate > 0) {
        console.log(`Need to create ${tutorsToCreate} additional random tutors.`);
        const courseArray = Array.from(createdCoursesMap.values());
        if (courseArray.length === 0) {
            console.error('No courses available to assign to new random tutors.');
            return;
        }
        for (let i = 0; i < tutorsToCreate; i++) {
            const firstName = faker_1.fakerES.person.firstName();
            const lastName = faker_1.fakerES.person.lastName();
            const fullName = `${firstName} ${lastName}`;
            if (!createdTutorsMap.has(fullName)) {
                try {
                    const userEmail = faker_1.fakerES.internet
                        .email({ firstName, lastName, provider: 'exampleudp.com' })
                        .toLowerCase();
                    const user = await prisma.user.create({
                        data: {
                            full_name: fullName,
                            email: userEmail,
                            password: faker_1.fakerES.internet.password(),
                            role: client_1.Role.BOTH,
                            photo_url: faker_1.fakerES.image.avatar(),
                            email_verified: true,
                        },
                    });
                    const tutorProfile = await prisma.tutorProfile.create({
                        data: {
                            userId: user.id,
                            bio: faker_1.fakerES.lorem.paragraph(),
                            average_rating: parseFloat(faker_1.fakerES.number
                                .float({ min: 3.5, max: 5, fractionDigits: 1 })
                                .toFixed(1)),
                        },
                    });
                    createdTutorsMap.set(fullName, { user, profile: tutorProfile });
                    console.log(`Created random tutor: ${user.full_name}`);
                    const numTutorCourses = faker_1.fakerES.number.int({
                        min: 1,
                        max: Math.min(3, courseArray.length),
                    });
                    for (let j = 0; j < numTutorCourses; j++) {
                        const randomCourse = courseArray[faker_1.fakerES.number.int({ min: 0, max: courseArray.length - 1 })];
                        await prisma.tutorCourse.upsert({
                            where: {
                                tutorId_courseId: {
                                    tutorId: tutorProfile.id,
                                    courseId: randomCourse.id,
                                },
                            },
                            update: {},
                            create: {
                                tutorId: tutorProfile.id,
                                courseId: randomCourse.id,
                                level: faker_1.fakerES.helpers.arrayElement([
                                    'Básico',
                                    'Intermedio',
                                    'Avanzado',
                                ]),
                                grade: parseFloat(faker_1.fakerES.number
                                    .float({ min: 4.0, max: 7.0, fractionDigits: 1 })
                                    .toFixed(1)),
                            },
                        });
                    }
                }
                catch (e) {
                    console.warn(`Could not create random tutor ${fullName}: ${e.message}`);
                }
            }
        }
    }
}
async function seedTutoringSessions(createdTutorsMap) {
    let tutoringSessionsCreatedCount = 0;
    const maxTutorias = 100;
    const tutorArray = Array.from(createdTutorsMap.values());
    if (tutorArray.length === 0) {
        console.error('No tutors available to create tutoring sessions.');
        return 0;
    }
    for (let i = 0; i < maxTutorias; i++) {
        const tutorData = tutorArray[faker_1.fakerES.number.int({ min: 0, max: tutorArray.length - 1 })];
        const assignedTutorCourses = await prisma.tutorCourse.findMany({
            where: { tutorId: tutorData.profile.id },
            include: { course: true },
        });
        if (assignedTutorCourses.length === 0) {
            continue;
        }
        const randomTutorCourseRelation = assignedTutorCourses[faker_1.fakerES.number.int({ min: 0, max: assignedTutorCourses.length - 1 })];
        const course = randomTutorCourseRelation.course;
        const startDate = faker_1.fakerES.date.soon({ days: 30 });
        const startTime = new Date(startDate);
        startTime.setHours(faker_1.fakerES.number.int({ min: 9, max: 17 }), faker_1.fakerES.helpers.arrayElement([0, 30]), 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + faker_1.fakerES.number.int({ min: 1, max: 2 }));
        try {
            await prisma.tutoringSession.create({
                data: {
                    tutorId: tutorData.profile.id,
                    courseId: course.id,
                    title: `Tutoría de ${course.name} por ${tutorData.user.full_name}`,
                    description: faker_1.fakerES.lorem.sentence({ min: 5, max: 15 }),
                    date: startDate,
                    start_time: startTime,
                    end_time: endTime,
                    status: client_1.BookingStatus.AVAILABLE,
                    location: faker_1.fakerES.helpers.arrayElement([
                        'Online',
                        `Sala ${faker_1.fakerES.string.alphanumeric({ length: 3, casing: 'upper' })}`,
                        'Biblioteca Central',
                        `Auditorio ${faker_1.fakerES.number.int({ min: 1, max: 5 })}`,
                    ]),
                    notes: faker_1.fakerES.lorem.words(faker_1.fakerES.number.int({ min: 0, max: 10 })),
                },
            });
            tutoringSessionsCreatedCount++;
            if (tutoringSessionsCreatedCount % 10 === 0 ||
                tutoringSessionsCreatedCount === maxTutorias) {
                console.log(`Created ${tutoringSessionsCreatedCount} tutoring sessions...`);
            }
        }
        catch (e) {
            console.error(`Error creating tutoring session for ${course.name} by ${tutorData.user.full_name}:`, e);
        }
        if (tutoringSessionsCreatedCount >= maxTutorias)
            break;
    }
    return tutoringSessionsCreatedCount;
}
async function main() {
    console.log('Start seeding ...');
    const createdCoursesMap = new Map();
    const createdTutorsMap = new Map();
    const newCourseNames = [
        'ADM DE PROYECTOS CIVILES', 'ARQUITECTURA DE SOFTWARE', 'ARQUITECTURA Y ORGANIZ DE COMPUTADORES',
        'ARQUITECTURAS EMERGENTES', 'ANÁLISIS ESTRUCTURAL', 'BASES DE DATOS', 'BASES DE DATOS AVANZADAS',
        'BIM', 'CALOR Y ONDAS', 'COMUNICACIONES DIGITALES', 'COMUNICACIÓN PARA LA INGENIERÍA',
        'CONTABILIDAD Y COSTOS', 'CRIPTOGRAFÍA Y SEGURIDAD EN REDES', 'CÁLCULO I', 'CÁLCULO II',
        'CÁLCULO III', 'DATA SCIENCE', 'DESARROLLO WEB Y MÓVIL', 'DISEÑO EN ACERO',
        'DISEÑO EN HORMIGÓN', 'DISEÑO ESTRUCTURAL', 'DISEÑO DE CAMINOS', 'ECUACIONES DIFERENCIALES',
        'EDIFICACIÓN', 'ELECTRICIDAD Y MAGNETISMO', 'ELECTRÓNICA Y ELECTROTECNIA',
        'ESTRUCTURAS DE DATOS Y ALGORITMOS', 'ESTÁTICA', 'EVALUACIÓN DE PROYECTOS',
        'EVALUACIÓN DE PROYECTOS TIC', 'FINANZAS', 'FUNDACIONES', 'GESTIÓN ORGANIZACIONAL',
        'HIDROLOGÍA', 'HIDRÁULICA', 'HIDRÁULICA URBANA', 'INGENIERIA ECONÓMICA',
        'INGENIERÍA AMBIENTAL', 'INGENIERÍA DE COSTOS', 'INGENIERÍA DE SOFTWARE',
        'INGENIERÍA EN MATERIALES', 'INGENIERÍA SÍSMICA', 'INFERENCIA ESTADÍSTICA',
        'INTELIGENCIA ARTIFICIAL', 'INTRODUCCIÓN  A LA ECONOMÍA',
        'LIDERAZGO Y EMPRENDIMIENTO', 'LOGÍSTICA', 'MECÁNICA', 'MECÁNICA DE FLUIDOS',
        'MECÁNICA DE SUELOS', 'MECÁNICA DE SÓLIDOS', 'MICROECONOMETRÍA', 'MICROECONOMÍA',
        'MODELOS ESTOCÁSTICOS', 'OPTIMIZACIÓN', 'PLANIFICACIÓN DE PROYECTOS',
        'PROBABILIDADES Y ESTADÍSTICA', 'PRODUCCIÓN', 'PROGRAMACIÓN', 'PROGRAMACIÓN AVANZADA',
        'PROYECTO EN TICS I', 'PROYECTO EN TICS II', 'PROYECTOS ENERGÉTICOS', 'QUÍMICA',
        'REDES DE DATOS', 'SEMINARIO CS. INGENIERÍA', 'SEÑALES Y SISTEMAS', 'SIMULACIÓN',
        'SISTEMAS DISTRIBUIDOS', 'SISTEMAS OPERATIVOS', 'TALLER DE INGENIERIA INDUSTRIAL',
        'TALLER DE REDES Y SERVICIOS', 'TECNOLOGÍA DEL HORMIGÓN', 'TECNOLOGÍAS INALÁMBRICAS',
        'TEORÍA ORGANIZACIÓNAL', 'TERMODINÁMICA', 'TOPOGRAFÍA', 'ÁLGEBRA LINEAL',
        'ÁLGEBRA Y GEOMETRÍA'
    ];
    console.log(`Attempting to seed ${newCourseNames.length} courses from the new list...`);
    for (const courseName of newCourseNames) {
        const subjectArea = getSubjectAreaFromName(courseName);
        const normalizedCourseName = courseName.replace(/\s\s+/g, ' ');
        try {
            const course = await prisma.course.upsert({
                where: { name: normalizedCourseName },
                update: { subject_area: subjectArea },
                create: { name: normalizedCourseName, subject_area: subjectArea },
            });
            createdCoursesMap.set(course.name, course);
            console.log(`Upserted course: ${course.name} (Subject Area: ${course.subject_area}, ID: ${course.id})`);
        }
        catch (e) {
            console.error(`Error upserting course ${normalizedCourseName}:`, e.message);
        }
    }
    console.log(`${createdCoursesMap.size} courses processed from the new list.`);
    console.log(`Seeding finished. Total courses in DB: ${await prisma.course.count()}, Total tutors in DB: ${await prisma.tutorProfile.count()}.`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map