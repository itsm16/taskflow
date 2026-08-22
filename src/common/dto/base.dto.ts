import z from "zod";

export class BaseDto{
    static schema = z.object({})

    static validate(data: any) {
        const {data: validatedData, error} = this.schema.safeParse(data)

        if(error) {
            const errors = error.issues.map(err => err.message);
            return { data: null, errors }
        }

        return { data: validatedData }
    }
}