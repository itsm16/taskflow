import type { Response } from 'express'

class ApiResponse{
    static ok(res: Response, message: string, data?: any){
        return res.status(200).json({ message, data: data || null })
    }

    static created(res: Response, message: string, data?: any){
        return res.status(200).json({ message, data: data || null })
    }

    static notFound(res: Response, message = "Not found", data?: any){
        return res.status(404).json({ message, data: data || null })
    }
}

export default ApiResponse