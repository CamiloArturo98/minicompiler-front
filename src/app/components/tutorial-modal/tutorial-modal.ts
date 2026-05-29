import {
  ChangeDetectionStrategy,
  Component,
  output,
  signal,
  computed,
} from '@angular/core';

interface TutorialSection {
  id: string;
  icon: string;
  title: string;
  description: string;
  examples: { label: string; code: string; output?: string }[];
}

@Component({
  selector: 'app-tutorial-modal',
  templateUrl: './tutorial-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'fixed inset-0 z-50 flex items-center justify-center',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'MiniScript language tutorial',
  },
})
export class TutorialModalComponent {
  readonly close = output<void>();

  readonly activeSection = signal('variables');

  readonly sections: TutorialSection[] = [
    {
      id: 'variables',
      icon: '📦',
      title: 'Variables',
      description: 'Declare variables with var. Values can be numbers, strings, or booleans.',
      examples: [
        {
          label: 'Number & string',
          code: `var age = 25;\nvar name = "MiniScript";\nprint(name + " v" + age);`,
          output: 'MiniScript v25',
        },
        {
          label: 'Boolean',
          code: `var active = true;\nvar done = false;\nprint(active);`,
          output: 'true',
        },
      ],
    },
    {
      id: 'operators',
      icon: '⚙️',
      title: 'Operators',
      description: 'Arithmetic, comparison, logical and compound assignment operators.',
      examples: [
        {
          label: 'Arithmetic',
          code: `var x = 10;\nprint(x + 3);   // 13\nprint(x - 3);   // 7\nprint(x * 2);   // 20\nprint(x / 4);   // 2.5\nprint(x % 3);   // 1\nprint(2 ** 8);  // 256`,
          output: '13  7  20  2.5  1  256',
        },
        {
          label: 'Compound assignment',
          code: `var n = 100;\nn += 20;\nn -= 10;\nn *= 2;\nn /= 5;\nprint(n);`,
          output: '44',
        },
        {
          label: 'Comparison & logical',
          code: `var a = 5;\nprint(a > 3);          // true\nprint(a == 10);        // false\nprint(a > 3 and a < 10); // true\nprint(a < 0 or a > 3); // true\nprint(not false);      // true`,
          output: 'true  false  true  true  true',
        },
      ],
    },
    {
      id: 'conditionals',
      icon: '🔀',
      title: 'Conditionals',
      description: 'Use if / else to branch your logic.',
      examples: [
        {
          label: 'if / else',
          code: `var score = 85;\n\nif (score >= 90) {\n    print("A");\n} else {\n    if (score >= 80) {\n        print("B");\n    } else {\n        print("C");\n    }\n}`,
          output: 'B',
        },
        {
          label: 'Inline condition',
          code: `var x = 7;\n\nif (x % 2 == 0) {\n    print("even");\n} else {\n    print("odd");\n}`,
          output: 'odd',
        },
      ],
    },
    {
      id: 'loops',
      icon: '🔁',
      title: 'Loops',
      description: 'Repeat code with while. Use ++ and -- to update counters.',
      examples: [
        {
          label: 'while loop',
          code: `var i = 1;\nwhile (i <= 5) {\n    print(i);\n    i++;\n}`,
          output: '1  2  3  4  5',
        },
        {
          label: 'Accumulator',
          code: `var sum = 0;\nvar i = 1;\nwhile (i <= 100) {\n    sum += i;\n    i++;\n}\nprint(sum);`,
          output: '5050',
        },
      ],
    },
    {
      id: 'functions',
      icon: '🧩',
      title: 'Functions',
      description: 'Declare reusable blocks with function. Recursion is fully supported.',
      examples: [
        {
          label: 'Basic function',
          code: `function greet(name) {\n    return "Hello, " + name + "!";\n}\n\nprint(greet("World"));`,
          output: 'Hello, World!',
        },
        {
          label: 'Multiple params',
          code: `function add(a, b) {\n    return a + b;\n}\n\nprint(add(3, 4));`,
          output: '7',
        },
        {
          label: 'Recursion',
          code: `function factorial(n) {\n    if (n <= 1) { return 1; }\n    return n * factorial(n - 1);\n}\n\nprint(factorial(6));`,
          output: '720',
        },
      ],
    },
    {
      id: 'strings',
      icon: '💬',
      title: 'Strings',
      description: 'Strings use double quotes and concatenate with +.',
      examples: [
        {
          label: 'Concatenation',
          code: `var lang = "Mini";\nvar type = "Script";\nprint(lang + type);`,
          output: 'MiniScript',
        },
        {
          label: 'Mixed types',
          code: `var pi = 3.14159;\nprint("Pi = " + pi);`,
          output: 'Pi = 3.14159',
        },
      ],
    },
    {
      id: 'quickref',
      icon: '📋',
      title: 'Quick Reference',
      description: 'Full syntax cheat sheet at a glance.',
      examples: [],
    },
  ];

  readonly activeData = computed(
    () => this.sections.find(s => s.id === this.activeSection()) ?? this.sections[0],
  );

  setSection(id: string): void {
    this.activeSection.set(id);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).dataset['backdrop']) {
      this.close.emit();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.close.emit();
  }
}
