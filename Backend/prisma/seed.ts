import { PrismaClient, Role, DayOfWeek, BookingStatus, Course, User, TutorProfile as PrismaTutorProfile, TutoringSession as PrismaTutoringSession } from '@prisma/client';
import { fakerES as faker } from '@faker-js/faker'; // Usar faker en español
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper para capitalizar nombres de cursos y áreas
function capitalize(str: string): string {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
}

// Helper para obtener un área de materia basada en el nombre del curso
function getSubjectAreaFromName(courseName: string): string {
  const lowerCaseName = courseName.toLowerCase();
  if (lowerCaseName.includes('cálculo') || lowerCaseName.includes('álgebra') || lowerCaseName.includes('ecuaciones')) return 'Matemáticas';
  if (lowerCaseName.includes('programación') || lowerCaseName.includes('datos') || lowerCaseName.includes('software') || lowerCaseName.includes('computadores') || lowerCaseName.includes('sistemas operativos') || lowerCaseName.includes('redes')) return 'Informática';
  if (lowerCaseName.includes('física') || lowerCaseName.includes('mecánica') || lowerCaseName.includes('termodinámica') || lowerCaseName.includes('electricidad') || lowerCaseName.includes('ondas')) return 'Física';
  if (lowerCaseName.includes('química')) return 'Química';
  if (lowerCaseName.includes('economía') || lowerCaseName.includes('finanzas') || lowerCaseName.includes('contabilidad')) return 'Economía y Finanzas';
  if (lowerCaseName.includes('estadística') || lowerCaseName.includes('probabilidades')) return 'Estadística';
  if (lowerCaseName.includes('inglés')) return 'Idiomas';
  if (lowerCaseName.includes('proyecto') || lowerCaseName.includes('taller')) return 'Proyectos y Talleres';
  if (lowerCaseName.includes('industrial') || lowerCaseName.includes('operaciones') || lowerCaseName.includes('logística') || lowerCaseName.includes('gestión')) return 'Ingeniería Industrial';
  if (lowerCaseName.includes('civil') || lowerCaseName.includes('estructural') || lowerCaseName.includes('hormigón') || lowerCaseName.includes('suelos') || lowerCaseName.includes('hidráulica') || lowerCaseName.includes('ambiental') || lowerCaseName.includes('edificación')) return 'Ingeniería Civil';
  return 'General';
}

async function seedCoursesAndTutorsFromOutputJson(
  createdCoursesMap: Map<string, Course>,
  createdTutorsMap: Map<string, { user: User, profile: PrismaTutorProfile }>
): Promise<boolean> { // Devuelve true si output.json fue procesado
  const outputPath = path.join(__dirname, '..', 'output.json');
  if (!fs.existsSync(outputPath)) {
    console.log('output.json not found. Skipping seeding from JSON.');
    return false;
  }

  let jsonData: { NOMBRE: string; "Profesor(a)": string }[] = [];
  try {
    const fileContent = fs.readFileSync(outputPath, 'utf-8');
    jsonData = JSON.parse(fileContent);
    console.log('Successfully read and parsed output.json.');
  } catch (error) {
    console.error('Error reading or parsing output.json:', error);
    return false; // Indica que no se procesó output.json
  }

  for (const item of jsonData) {
    const courseName = capitalize(item.NOMBRE);
    const professorName = item["Profesor(a)"];

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
      } catch (e) {
        console.error(`Error upserting course ${courseName} from JSON:`, e);
        continue;
      }
    }

    let tutorData = createdTutorsMap.get(professorName);
    if (!tutorData) {
      try {
        const userEmail = `${professorName.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/gi, '')}@exampleudp.com`;
        let user = await prisma.user.findUnique({ where: { email: userEmail } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              full_name: professorName,
              email: userEmail,
              password: faker.internet.password(),
              role: Role.BOTH,
              photo_url: faker.image.avatar(),
              email_verified: true,
            },
          });
        }
        let tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
        if (!tutorProfile) {
          tutorProfile = await prisma.tutorProfile.create({
            data: {
              userId: user.id,
              bio: faker.lorem.paragraph(),
              average_rating: parseFloat(faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }).toFixed(1)),
            },
          });
        }
        tutorData = { user, profile: tutorProfile };
        createdTutorsMap.set(professorName, tutorData);
        console.log(`Upserted tutor from JSON: ${user.full_name}`);
      } catch (e) {
        console.error(`Error upserting tutor ${professorName} from JSON:`, e);
        continue;
      }
    }
    
    if (course && tutorData) {
        try {
            await prisma.tutorCourse.upsert({
                where: { tutorId_courseId: { tutorId: tutorData.profile.id, courseId: course.id } },
                update: {},
                create: {
                    tutorId: tutorData.profile.id,
                    courseId: course.id,
                    level: faker.helpers.arrayElement(['Básico', 'Intermedio', 'Avanzado']),
                    grade: parseFloat(faker.number.float({ min: 4.0, max: 7.0, fractionDigits: 1 }).toFixed(1)),
                }
            });
        } catch (e) {
            console.error(`Error upserting TutorCourse for ${tutorData.user.full_name} and ${course.name}:`, e);
        }
    }
  }
  return true; // Indica que output.json fue procesado
}

async function ensureRandomCoursesAndTutors(
  minCourses: number,
  minTutors: number,
  createdCoursesMap: Map<string, Course>,
  createdTutorsMap: Map<string, { user: User, profile: PrismaTutorProfile }>
): Promise<void> {
  let coursesToCreate = minCourses - createdCoursesMap.size;
  if (coursesToCreate > 0) {
    console.log(`Need to create ${coursesToCreate} additional random courses.`);
    for (let i = 0; i < coursesToCreate; i++) {
      const courseName = capitalize(faker.lorem.words(faker.number.int({ min: 2, max: 4 })));
      if (!createdCoursesMap.has(courseName)) {
        const subjectArea = getSubjectAreaFromName(courseName);
        try {
          const course = await prisma.course.create({
            data: { name: courseName, subject_area: subjectArea },
          });
          createdCoursesMap.set(courseName, course);
          console.log(`Created random course: ${course.name}`);
        } catch (e) {
          // Podría fallar si el nombre generado aleatoriamente ya existe (raro pero posible)
          console.warn(`Could not create random course ${courseName}: ${(e as Error).message}`);
        }
      }
    }
  }

  let tutorsToCreate = minTutors - createdTutorsMap.size;
  if (tutorsToCreate > 0) {
    console.log(`Need to create ${tutorsToCreate} additional random tutors.`);
    const courseArray = Array.from(createdCoursesMap.values());
    if (courseArray.length === 0) {
        console.error("No courses available to assign to new random tutors.");
        return;
    }

    for (let i = 0; i < tutorsToCreate; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const fullName = `${firstName} ${lastName}`;
      
      if (!createdTutorsMap.has(fullName)) {
        try {
          const userEmail = faker.internet.email({ firstName, lastName, provider: 'exampleudp.com' }).toLowerCase();
          const user = await prisma.user.create({
            data: {
              full_name: fullName,
              email: userEmail,
              password: faker.internet.password(),
              role: Role.BOTH,
              photo_url: faker.image.avatar(),
              email_verified: true,
            },
          });
          const tutorProfile = await prisma.tutorProfile.create({
            data: {
              userId: user.id,
              bio: faker.lorem.paragraph(),
              average_rating: parseFloat(faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }).toFixed(1)),
            },
          });
          createdTutorsMap.set(fullName, { user, profile: tutorProfile });
          console.log(`Created random tutor: ${user.full_name}`);

          const numTutorCourses = faker.number.int({ min: 1, max: Math.min(3, courseArray.length) });
          for (let j = 0; j < numTutorCourses; j++) {
            const randomCourse = courseArray[faker.number.int({ min: 0, max: courseArray.length - 1 })];
            await prisma.tutorCourse.upsert({
                where: { tutorId_courseId: { tutorId: tutorProfile.id, courseId: randomCourse.id } },
                update: {},
                create: {
                    tutorId: tutorProfile.id,
                    courseId: randomCourse.id,
                    level: faker.helpers.arrayElement(['Básico', 'Intermedio', 'Avanzado']),
                    grade: parseFloat(faker.number.float({ min: 4.0, max: 7.0, fractionDigits: 1 }).toFixed(1)),
                }
            });
          }
        } catch (e) {
           console.warn(`Could not create random tutor ${fullName}: ${(e as Error).message}`);
        }
      }
    }
  }
}

async function seedTutoringSessions(
  createdTutorsMap: Map<string, { user: User, profile: PrismaTutorProfile }>
): Promise<number> {
  let tutoringSessionsCreatedCount = 0;
  const maxTutorias = 100;
  
  const tutorArray = Array.from(createdTutorsMap.values());

  if (tutorArray.length === 0) {
    console.error("No tutors available to create tutoring sessions.");
    return 0;
  }

  for (let i = 0; i < maxTutorias; i++) {
    const tutorData = tutorArray[faker.number.int({ min: 0, max: tutorArray.length - 1 })];
    
    const assignedTutorCourses = await prisma.tutorCourse.findMany({
        where: { tutorId: tutorData.profile.id },
        include: { course: true }
    });

    if (assignedTutorCourses.length === 0) {
        // console.warn(`Tutor ${tutorData.user.full_name} has no courses assigned, skipping session creation for this tutor.`);
        continue; 
    }
    
    const randomTutorCourseRelation = assignedTutorCourses[faker.number.int({ min: 0, max: assignedTutorCourses.length - 1 })];
    const course = randomTutorCourseRelation.course;

    const startDate = faker.date.soon({ days: 30 });
    const startTime = new Date(startDate);
    startTime.setHours(faker.number.int({ min: 9, max: 17 }), faker.helpers.arrayElement([0, 30]), 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + faker.number.int({ min: 1, max: 2 }));

    try {
      await prisma.tutoringSession.create({
        data: {
          tutorId: tutorData.profile.id,
          courseId: course.id,
          title: `Tutoría de ${course.name} por ${tutorData.user.full_name}`,
          description: faker.lorem.sentence({ min: 5, max: 15 }),
          date: startDate,
          start_time: startTime,
          end_time: endTime,
          status: BookingStatus.AVAILABLE,
          location: faker.helpers.arrayElement(['Online', `Sala ${faker.string.alphanumeric({length: 3, casing: 'upper'})}`, 'Biblioteca Central', `Auditorio ${faker.number.int({min:1, max:5})}`]),
          notes: faker.lorem.words(faker.number.int({ min: 0, max: 10 })),
        },
      });
      tutoringSessionsCreatedCount++;
      if (tutoringSessionsCreatedCount % 10 === 0 || tutoringSessionsCreatedCount === maxTutorias) {
        console.log(`Created ${tutoringSessionsCreatedCount} tutoring sessions...`);
      }
    } catch (e) {
      console.error(`Error creating tutoring session for ${course.name} by ${tutorData.user.full_name}:`, e);
    }
     if (tutoringSessionsCreatedCount >= maxTutorias) break;
  }
  return tutoringSessionsCreatedCount;
}

async function main() {
  console.log('Start seeding ...');

  await prisma.bookingHistory.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.feedback.deleteMany({});
  // await prisma.tutoringSession.deleteMany({}); // Comentado para no borrar tutorías existentes
  console.log('Deleted existing bookings and feedbacks. Tutoring sessions and tutor courses are preserved unless re-seeded specifically.');
  // await prisma.tutorCourse.deleteMany({}); // Comentado también si las tutorías dependen de estos y no se quieren borrar masivamente
  console.log('Tutor courses are preserved.');
  // Considerar si se deben borrar también Users y TutorProfiles que no vengan de output.json
  // o si se deben borrar todos los Users/TutorProfiles/Courses y recrearlos.
  // Por ahora, los upserts manejarán la creación o actualización.

  const createdCoursesMap = new Map<string, Course>();
  const createdTutorsMap = new Map<string, { user: User, profile: PrismaTutorProfile }>();

  // const outputJsonProcessed = await seedCoursesAndTutorsFromOutputJson(createdCoursesMap, createdTutorsMap); // Comentado para no crear tutores/cursos desde output.json
  const outputJsonProcessed = false; // Asumir que no se procesó
  console.log('Skipped seeding courses and tutors from output.json.');

  // Si output.json no existía o no se procesó, o para asegurar un mínimo de datos.
  const minTotalCourses = 0; // No crear cursos aleatorios
  const minTotalTutors = 0;  // No crear tutores aleatorios
  // await ensureRandomCoursesAndTutors(minTotalCourses, minTotalTutors, createdCoursesMap, createdTutorsMap); // Comentado para no crear tutores/cursos aleatorios
  console.log('Skipped ensuring random courses and tutors.');
  
  // const sessionsCreated = await seedTutoringSessions(createdTutorsMap); // Comentado para no crear nuevas tutorías de prueba
  const sessionsCreated = 0; // Asumir 0 para el log
  console.log('Skipped creating new seed tutoring sessions.');


  console.log(`Seeding finished. Total courses in DB: ${await prisma.course.count()}, Total tutors in DB: ${await prisma.tutorProfile.count()}, Tutoring sessions created in this run: ${sessionsCreated}.`);
  
  const outputPath = path.join(__dirname, '..', 'output.json');
  const processedOutputPath = path.join(__dirname, '..', 'output.json.processed');

  if (outputJsonProcessed && fs.existsSync(outputPath)) {
    try {
      fs.renameSync(outputPath, processedOutputPath);
      console.log(`output.json has been renamed to output.json.processed to prevent re-processing on next seed.`);
      console.log(`If you need to re-process output.json, rename output.json.processed back to output.json before running the seed again.`);
    } catch (err) {
      console.error('Error renaming output.json:', err);
    }
  } else if (!fs.existsSync(outputPath) && fs.existsSync(processedOutputPath)) {
    console.log('output.json was already processed (output.json.processed exists). Using fully random data for tutors/courses if needed beyond what was previously processed.');
  } else if (!fs.existsSync(outputPath)) {
    console.log('output.json not found. Using fully random data for tutors/courses.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
