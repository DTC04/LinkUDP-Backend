declare enum Role {
    STUDENT = "STUDENT",
    BOTH = "BOTH"
}
export declare class RegisterDto {
    full_name: string;
    email: string;
    password: string;
    role: Role;
}
export {};
