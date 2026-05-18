declare module 'bpmn-moddle' {
  interface BpmnModdleOptions {
    [key: string]: any;
  }

  interface ModdleElement {
    $type: string;
    id?: string;
    [key: string]: any;
  }

  interface ParseResult {
    rootElement: ModdleElement;
    elements: ModdleElement[];
    definitions: ModdleElement;
  }

  class BpmnModdle {
    constructor(options?: BpmnModdleOptions);
    fromXML(xml: string, done?: (err: Error | null, result: ParseResult) => void): Promise<ParseResult>;
    toXML(element: ModdleElement, done?: (err: Error | null, xml: string) => void): Promise<string>;
  }

  export default BpmnModdle;
}

declare module 'bpmn-engine' {
  interface EngineOptions {
    source: string;
    [key: string]: any;
  }

  interface EngineExecution {
    id: string;
    start(): Promise<void>;
    stop(): Promise<void>;
    signal(messageName: string, context: Record<string, any>): Promise<void>;
    on(event: string, handler: (...args: any[]) => void): void;
    getState(): any;
    [key: string]: any;
  }

  class Engine {
    constructor(options: EngineOptions);
    start(options?: { context?: Record<string, any> }): Promise<EngineExecution>;
    on(event: string, handler: (...args: any[]) => void): void;
    signal(executionId: string, messageName: string, context: Record<string, any>): Promise<void>;
    getState(): any;
    [key: string]: any;
  }

  export { Engine, EngineOptions, EngineExecution };
  export default Engine;
}
