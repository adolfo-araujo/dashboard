import { ForbiddenError, TransactionNotFoundError } from '../../errors/index.js'

export class UpdateTransactionUseCase {
    constructor(updateTransactionRepository, getTransactionByIdRepository) {
        this.updateTransactionRepository = updateTransactionRepository
        this.getTransactionByIdRepository = getTransactionByIdRepository
    }

    async execute(transactionId, params) {
        const transaction =
            await this.getTransactionByIdRepository.execute(transactionId)

        if (!transaction) {
            throw new TransactionNotFoundError(transactionId)
        }

        // eslint-disable-next-line no-unused-vars
        const { user_id, ...data } = params

        // o dono da transação é o único que pode alterá-la
        if (user_id && transaction.user_id !== user_id) {
            throw new ForbiddenError()
        }

        return await this.updateTransactionRepository.execute(
            transactionId,
            data,
        )
    }
}
