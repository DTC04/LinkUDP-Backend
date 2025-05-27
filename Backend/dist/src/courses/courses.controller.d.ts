import { CoursesService } from './courses.service';
import { Course } from '@prisma/client';
export declare class CoursesController {
    private readonly coursesService;
    constructor(coursesService: CoursesService);
    findAll(): Promise<Course[]>;
}
