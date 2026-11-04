import { UserNotFoundError } from '../../errors/user.js'
import { createTransactionSchema } from '../../schemas/transaction.js'
import {
    badRequest,
    created,
    serverError,
    userNotFoundResponse,
} from '../helpers/index.js'
import { ZodError } from 'zod'

export class CreateTransactionController {
    constructor(createTransactionUseCase) {
        this.createTransactionUseCase = createTransactionUseCase
    }

    async execute(httpRequest) {
        try {
            // Usa só os campos validados: qualquer outro campo enviado
            // (ex.: recurring_id, created_at) é descartado.
            const params = await createTransactionSchema.parseAsync(
                httpRequest.body,
            )

            const transaction =
                await this.createTransactionUseCase.execute(params)

            return created(transaction)
        } catch (error) {
            if (error instanceof ZodError) {
                return badRequest({
                    message: error.issues[0].message,
                })
            }

            if (error instanceof UserNotFoundError) {
                return userNotFoundResponse()
            }

            console.error(error)
            return serverError()
        }
    }
}
