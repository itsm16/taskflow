import type { Request, Response, NextFunction } from "express";
import type { BaseDto } from "../dto/base.dto.js";
import ApiError from "../utils/api-error.js";

export const validate = (DtoClass : typeof BaseDto) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { errors } = DtoClass.validate(req.body);
        if (errors) {
            const errorMessage = errors.join(", ");
            return ApiError.badRequest(errorMessage);
        }
        next();
    };
};