import { randomUUID } from 'crypto'

// UUID v4 com o gerador nativo do Node (dispensa a biblioteca uuid)
export class IdGeneratorAdapter {
    execute() {
        return randomUUID()
    }
}
