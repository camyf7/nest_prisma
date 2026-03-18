import { Injectable } from '@nestjs/common';

@Injectable()
export class TasksService {
	listAllTasks() {
		return [
			{ id: 1, task: "Comprar pão" },
			{ id: 2, task: "Estudar para prova"}
		]
	}

	findOneTask(id: string) {
		return { id: id, task: "Comprar pão" }
	}

	create(body: any) {
		return body
	}

	update(id: string, body: any) {
		let retorno = { id, body }
		return retorno
	}

	delete(id: string) {
		return "Deletar a tarefa" + id
	}
}
