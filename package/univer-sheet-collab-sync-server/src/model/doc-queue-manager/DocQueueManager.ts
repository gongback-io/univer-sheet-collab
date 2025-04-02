export class DocQueueManager {
  private queueMap: Map<string, Promise<unknown>> = new Map();

  /**
   * docId 별로 직렬 실행을 보장하기 위해, enqueue로 전달받은 task를
   * 직렬화된 체인에 연결해서 실행.
   */
  public enqueue<T>(docId: string, task: () => Promise<T>): Promise<T> {
    const currentQueue = this.queueMap.get(docId) || Promise.resolve();

    // 기존 Promise 체인 뒤에 task()를 연결
    const newQueue = currentQueue
      .then(() => task())
      .finally(() => {
        // 작업이 끝난 후, queueMap에서 docId가 동일하다면 삭제 (체인 해제)
        if (this.queueMap.get(docId) === newQueue) {
          this.queueMap.delete(docId);
        }
      });

    this.queueMap.set(docId, newQueue);
    return newQueue as Promise<T>;
  }
} 