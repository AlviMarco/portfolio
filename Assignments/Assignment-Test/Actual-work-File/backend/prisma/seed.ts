import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Create admin user
    const adminEmail = 'admin@skillbridge.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (!existingAdmin) {
        const admin = await prisma.user.create({
            data: {
                email: adminEmail,
                role: 'ADMIN',
                name: 'Admin User',
            },
        });

        await prisma.account.create({
            data: {
                userId: admin.id,
                accountId: adminEmail,
                providerId: 'credential',
                password: hashedPassword,
            },
        });

        console.log('Admin user created successfully.');
    } else {
        console.log('Admin user already exists.');
    }

    // Create sample tutor with profile and availability
    const tutorEmail = 'tutor@skillbridge.com';
    const tutorPassword = 'tutor123';
    const tutorHashedPassword = await bcrypt.hash(tutorPassword, 10);

    const existingTutor = await prisma.user.findUnique({
        where: { email: tutorEmail },
        include: { tutorProfile: true },
    });

    if (!existingTutor) {
        const tutor = await prisma.user.create({
            data: {
                email: tutorEmail,
                role: 'TUTOR',
                name: 'Jane Tutor',
            },
        });

        await prisma.account.create({
            data: {
                userId: tutor.id,
                accountId: tutorEmail,
                providerId: 'credential',
                password: tutorHashedPassword,
            },
        });

        // Create tutor profile with availability
        const tutorProfile = await prisma.tutorProfile.create({
            data: {
                userId: tutor.id,
                bio: 'Experienced math tutor with 5 years of teaching experience',
                subjects: ['Mathematics', 'Physics', 'Calculus'],
                hourlyRate: 50,
                availabilities: {
                    create: [
                        { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00' },
                        { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '17:00' },
                        { dayOfWeek: 'WEDNESDAY', startTime: '10:00', endTime: '18:00' },
                        { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '17:00' },
                        { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '15:00' },
                    ],
                },
            },
        });

        console.log('Tutor user and profile created successfully.');
        console.log('Tutor profile ID:', tutorProfile.id);
    } else {
        console.log('Tutor user already exists.');

        // Ensure tutor profile has availability
        if (existingTutor.tutorProfile) {
            const hasAvailability = await prisma.availability.count({
                where: { tutorProfileId: existingTutor.tutorProfile.id },
            });

            if (hasAvailability === 0) {
                await prisma.availability.createMany({
                    data: [
                        { tutorProfileId: existingTutor.tutorProfile.id, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00' },
                        { tutorProfileId: existingTutor.tutorProfile.id, dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '17:00' },
                        { tutorProfileId: existingTutor.tutorProfile.id, dayOfWeek: 'WEDNESDAY', startTime: '10:00', endTime: '18:00' },
                        { tutorProfileId: existingTutor.tutorProfile.id, dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '17:00' },
                        { tutorProfileId: existingTutor.tutorProfile.id, dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '15:00' },
                    ],
                });
                console.log('Availability data added to existing tutor profile.');
            } else {
                console.log('Tutor profile already has availability data.');
            }
        }
    }

    // Create sample student
    const studentEmail = 'student@skillbridge.com';
    const studentPassword = 'student123';
    const studentHashedPassword = await bcrypt.hash(studentPassword, 10);

    const existingStudent = await prisma.user.findUnique({
        where: { email: studentEmail },
    });

    if (!existingStudent) {
        const student = await prisma.user.create({
            data: {
                email: studentEmail,
                role: 'STUDENT',
                name: 'John Student',
            },
        });

        await prisma.account.create({
            data: {
                userId: student.id,
                accountId: studentEmail,
                providerId: 'credential',
                password: studentHashedPassword,
            },
        });

        console.log('Student user created successfully.');
    } else {
        console.log('Student user already exists.');
    }

    // Create categories
    const categories = [
        { name: 'Mathematics', description: 'Mathematics tutoring and courses' },
        { name: 'Physics', description: 'Physics tutoring and courses' },
        { name: 'Chemistry', description: 'Chemistry tutoring and courses' },
        { name: 'Biology', description: 'Biology tutoring and courses' },
        { name: 'English', description: 'English language and literature tutoring' },
    ];

    for (const category of categories) {
        const existingCategory = await prisma.category.findUnique({
            where: { name: category.name },
        });

        if (!existingCategory) {
            await prisma.category.create({ data: category });
            console.log(`Category '${category.name}' created.`);
        } else {
            console.log(`Category '${category.name}' already exists.`);
        }
    }

    console.log('Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
