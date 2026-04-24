export interface CompileRequest {
  sourceCode: string;
  optimize: boolean;
  showTokens: boolean;
  showAst: boolean;
  showBytecode: boolean;
}

export interface Token {
  type: string;
  value: string;
  line: number;
  column: number;
}

export interface ExecutionResult {
  success: boolean;
  output: string[];
  finalMemory: Record<string, unknown>;
  error?: string;
  instructionsExecuted: number;
  executionTimeMs: number;
}

export interface CompileResponse {
  success: boolean;
  tokens?: Token[];
  ast?: string;
  bytecode?: string[];
  optimizedBytecode?: string[];
  executionResult: ExecutionResult;
  warnings?: string[];
  compilationTimeMs: number;
}

export interface CompileError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  phase?: string;
  line?: number;
  column?: number;
}

export type CompileTab = 'output' | 'tokens' | 'ast' | 'bytecode' | 'memory';

export interface EditorOptions {
  optimize: boolean;
  showTokens: boolean;
  showAst: boolean;
  showBytecode: boolean;
}

export const CODE_EXAMPLES: Record<string, { label: string; code: string }> = {
  fibonacci: {
    label: 'Fibonacci',
    code: `// Recursive Fibonacci
function fibonacci(n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

var result = fibonacci(10);
print("fibonacci(10) = " + result);`
  },
  factorial: {
    label: 'Factorial',
    code: `// Iterative Factorial
function factorial(n) {
    var result = 1;
    var i = 1;
    while (i <= n) {
        result = result * i;
        i++;
    }
    return result;
}

print("5! = " + factorial(5));
print("10! = " + factorial(10));`
  },
  loops: {
    label: 'Loops & Math',
    code: `// Sum of squares
var sum = 0;
var i = 1;

while (i <= 10) {
    sum += i * i;
    i++;
}

print("Sum of squares 1..10 = " + sum);

// FizzBuzz
var n = 1;
while (n <= 20) {
    if (n % 15 == 0) {
        print("FizzBuzz");
    } else {
        if (n % 3 == 0) {
            print("Fizz");
        } else {
            if (n % 5 == 0) {
                print("Buzz");
            } else {
                print(n);
            }
        }
    }
    n++;
}`
  },
  strings: {
    label: 'Strings',
    code: `// String operations
var name = "MiniCompiler";
var version = "1.0.0";
var greeting = "Welcome to " + name + " v" + version;
print(greeting);

var x = 3.14159;
var msg = "Pi is approximately " + x;
print(msg);

// Boolean logic
var a = true;
var b = false;
print("a and b = " + (a and b));
print("a or b  = " + (a or b));
print("not a   = " + (not a));`
  },
  power: {
    label: 'Power & Ops',
    code: `// Power operator and compound assignments
var base = 2;
var result = base ** 10;
print("2^10 = " + result);

var x = 100;
x -= 25;
x *= 2;
x /= 5;
print("x = " + x);

// Nested functions
function square(n)  { return n * n; }
function cube(n)    { return n * n * n; }
function hyp(a, b)  { return square(a) + square(b); }

print("3^2 + 4^2 = " + hyp(3, 4));
print("cube(5) = " + cube(5));`
  }
};

export type AiAction = 'EXPLAIN_ERROR' | 'SUGGEST_FIX' | 'GENERATE_CODE' | 'ANALYZE_CODE';

export interface AiRequest {
  action: AiAction;
  sourceCode?: string;
  errorMessage?: string;
  userPrompt?: string;
}

export interface AiResponse {
  content: string;
  action: string;
  responseTimeMs: number;
}

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  action?: AiAction;
  timestamp: Date;
  loading?: boolean;
}
