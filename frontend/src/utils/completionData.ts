export interface CompletionItem {
  label: string;
  kind: number; // monaco.languages.CompletionItemKind
  insertText: string;
  detail: string;
  documentation?: string;
}

export const LANGUAGE_COMPLETIONS: Record<string, CompletionItem[]> = {
  javascript: [
    { label: 'console.log', kind: 15, insertText: 'console.log($1);', detail: 'Log to console', documentation: 'Prints a message to the console.' },
    { label: 'function', kind: 15, insertText: 'function ${1:name}(${2:params}) {\n\t$0\n}', detail: 'Function declaration' },
    { label: 'const', kind: 14, insertText: 'const ', detail: 'Constant declaration' },
    { label: 'let', kind: 14, insertText: 'let ', detail: 'Variable declaration' },
    { label: 'if', kind: 15, insertText: 'if (${1:condition}) {\n\t$0\n}', detail: 'If statement' },
    { label: 'for', kind: 15, insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t$0\n}', detail: 'For loop' },
    { label: 'async', kind: 14, insertText: 'async ', detail: 'Async keyword' },
    { label: 'await', kind: 14, insertText: 'await ', detail: 'Await keyword' },
    { label: 'import', kind: 14, insertText: 'import { $1 } from "$2";', detail: 'Import statement' },
    { label: 'export', kind: 14, insertText: 'export ', detail: 'Export keyword' },
  ],
  python: [
    { label: 'print', kind: 15, insertText: 'print($1)', detail: 'Print function' },
    { label: 'def', kind: 15, insertText: 'def ${1:name}(${2:params}):\n\t$0', detail: 'Function definition' },
    { label: 'class', kind: 15, insertText: 'class ${1:ClassName}:\n\tdef __init__(self, $2):\n\t\t$0', detail: 'Class definition' },
    { label: 'if main', kind: 15, insertText: 'if __name__ == "__main__":\n\t$0', detail: 'Main block' },
    { label: 'import', kind: 14, insertText: 'import ', detail: 'Import module' },
    { label: 'from import', kind: 15, insertText: 'from $1 import $2', detail: 'Import from module' },
    { label: 'for in', kind: 15, insertText: 'for ${1:item} in ${2:iterable}:\n\t$0', detail: 'For loop' },
    { label: 'while', kind: 15, insertText: 'while ${1:condition}:\n\t$0', detail: 'While loop' },
  ],
  c: [
    ...[
      'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extern',
      'float', 'for', 'goto', 'if', 'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static',
      'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while'
    ].map(k => ({ label: k, kind: 14, insertText: k, detail: 'Keyword' })),
    { label: 'printf', kind: 15, insertText: 'printf("$1\\n"$2);', detail: 'Print formatted' },
    { label: 'scanf', kind: 15, insertText: 'scanf("$1", &$2);', detail: 'Scan formatted' },
    { label: 'include', kind: 14, insertText: '#include <$1>', detail: 'Include header' },
    { label: 'main', kind: 15, insertText: 'int main() {\n\t$0\n\treturn 0;\n}', detail: 'Main function' },
    { label: 'forloop', kind: 15, insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}', detail: 'For loop' },
    { label: 'ifelse', kind: 15, insertText: 'if (${1:condition}) {\n\t$0\n} else {\n\t\n}', detail: 'If-Else statement' },
    { label: 'structdef', kind: 15, insertText: 'struct ${1:name} {\n\t$0\n};', detail: 'Struct definition' },
  ],
  cpp: [
    ...[
      'alignas', 'alignof', 'and', 'and_eq', 'asm', 'atomic_cancel', 'atomic_commit', 'atomic_noexcept', 'auto',
      'bitand', 'bitor', 'bool', 'break', 'case', 'catch', 'char', 'char8_t', 'char16_t', 'char32_t', 'class',
      'compl', 'concept', 'const', 'consteval', 'constexpr', 'constinit', 'const_cast', 'continue', 'co_await',
      'co_return', 'co_yield', 'decltype', 'default', 'delete', 'do', 'double', 'dynamic_cast', 'else', 'enum',
      'explicit', 'export', 'extern', 'false', 'float', 'for', 'friend', 'goto', 'if', 'inline', 'int', 'long',
      'mutable', 'namespace', 'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 'private',
      'protected', 'public', 'reflexpr', 'register', 'reinterpret_cast', 'requires', 'return', 'short', 'signed',
      'sizeof', 'static', 'static_assert', 'static_cast', 'struct', 'switch', 'synchronized', 'template', 'this',
      'thread_local', 'throw', 'true', 'try', 'typedef', 'typeid', 'typename', 'union', 'unsigned', 'using',
      'virtual', 'void', 'volatile', 'wchar_t', 'while', 'xor', 'xor_eq'
    ].map(k => ({ label: k, kind: 14, insertText: k, detail: 'Keyword' })),
    { label: 'cout', kind: 15, insertText: 'std::cout << $1 << std::endl;', detail: 'Standard output' },
    { label: 'cin', kind: 15, insertText: 'std::cin >> $1;', detail: 'Standard input' },
    { label: 'vector', kind: 14, insertText: 'std::vector<$1> $2;', detail: 'Vector container' },
    { label: 'string', kind: 14, insertText: 'std::string ', detail: 'String type' },
    { label: 'include', kind: 14, insertText: '#include <$1>', detail: 'Include header' },
    { label: 'main', kind: 15, insertText: 'int main() {\n\t$0\n\treturn 0;\n}', detail: 'Main function' },
    { label: 'foreach', kind: 15, insertText: 'for (auto& ${1:item} : ${2:container}) {\n\t$0\n}', detail: 'Range-based for loop' },
    { label: 'using namespace', kind: 15, insertText: 'using namespace std;', detail: 'Namespace' },
  ],
  java: [
    ...[
      'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue',
      'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'goto', 'if',
      'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'private',
      'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
      'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'true', 'false', 'null'
    ].map(k => ({ label: k, kind: 14, insertText: k, detail: 'Keyword' })),
    { label: 'sysout', kind: 15, insertText: 'System.out.println($1);', detail: 'Print to console' },
    { label: 'psvm', kind: 15, insertText: 'public static void main(String[] args) {\n\t$0\n}', detail: 'Main method' },
    { label: 'classdef', kind: 15, insertText: 'public class ${1:Main} {\n\t$0\n}', detail: 'Class definition' },
    { label: 'forloop', kind: 15, insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}', detail: 'For loop' },
    { label: 'Scanner', kind: 14, insertText: 'Scanner scanner = new Scanner(System.in);', detail: 'Scanner for input' },
    { label: 'List', kind: 14, insertText: 'List<$1> $2 = new ArrayList<>();', detail: 'List implementation' },
  ],
};

