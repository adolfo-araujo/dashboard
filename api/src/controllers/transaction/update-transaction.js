import { ZodError } from 'zod'
import { updateTransactionSchema } from '../../schemas/transaction.js'
import {
    checkIfIdIsValid,
    invalidIdResponse,
    serverError,
    ok,
    badRequest,
    transactionNotFoundResponse,
    forbidden,
} from '../helpers/index.js'
import { TransactionNotFoundError } from '../../errors/transaction.js'
import { ForbiddenError } from '../../errors/user.js'

export class UpdateTransactionController {
    constructor(updateTransactionUseCase) {
        this.updateTransactionUseCase = updateTransactionUseCase
    }
    async execute(httpRequest) {
        try {
            const idIsValid = checkIfIdIsValid(httpRequest.params.transactionId)

            if (!idIsValid) {
                return invalidIdResponse()
            }

            // Usa só os campos validados: qualquer outro campo enviado
            // (ex.: recurring_id, created_at) é descartado.
            const params = await updateTransactionSchema.parseAsync(
                httpRequest.body,
            )

            const transaction = await this.updateTransactionUseCase.execute(
                httpRequest.params.transactionId,
                { ...params, user_id: httpRequest.body.user_id },
            )

            return ok(transaction)
        } catch (error) {
            if (error instanceof ZodError) {
                return badRequest({
                    message: error.issues[0].message,
                })
            }

            if (error instanceof TransactionNotFoundError) {
                return transactionNotFoundResponse()
            }

            if (error instanceof ForbiddenError) {
                return forbidden()
            }

            console.error(error)

            return serverError()
        }
    }
}
