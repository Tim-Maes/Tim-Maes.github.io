## Source Generators: The end of T4 templates?

In the evolving landscape of .NET Development, code generation has been a cornerstone for creating boilerplate code, improving developer productivity and automating processes. [T4 (Text Template Transformation Toolkit)](https://learn.microsoft.com/en-us/visualstudio/modeling/code-generation-and-t4-text-templates) has been the go-to solution for well over a decade for this purpose, offering a powerful but also a somewhat uderappreciated templating engine right inside Visual Studio. They have enabled developers to generate everything from data models to fully fledged API clients.

But, working with T4 has had issues since the start. There is no easy way to work with them, since there is no propper editor experience for them. They are hard to debug and by default you find yourself working in a 'plain text' environment, having no intellisense, syntax highlighting or language support. The open source community provided some solutions for this, but often they are incomplete.

I myself have been developing tools the past few years that provide some support when working with T4 templates. T4Editor provides a minimal editor experience, and T4Executer helps you control the execution of T4 templates during build time. 

#### The birth of Source Generators

The introduction of source generators in C# 9.0 and .NET 5 marks a significant evolution in how .NET developers approach code generation. Built on the [Roslyn](https://github.com/dotnet/roslyn) compiler platform, source generators promise to enhance, or can we say revolutionize code generation by integrating directly into the compile-time environment, offering a fluent and more performant alternative to traditional methods.

This leads to the question - are source generators here to make T4 templates a thing from te past? In this post we provide a high level overview and comparison between these tools.

### T4 Templates

T4 (Text Template Transformation Toolkit) templates have long been the standard for code generation within the .NET ecosystem. Embedded within Visual Studio, T4 templates offer a dynamic way to generate textual content based on predefined templates. These templates can include any sort of text, ranging from HTML and XML to fully functional C# code, making them incredibly versatile for a wide range of applications.

#### How T4 Templates Work

A T4 template file (.tt) consists of two main parts: template directives and control logic. The directives provide the compiler with information about how to process the template, such as the output file type. The control logic, written in a mixture of C# or VB.NET and T4 syntax, defines the actual content generation logic. When a T4 template is executed, it reads these instructions to produce the final text output, which can be another source code file, a configuration file, or any text-based file that suits the developer's needs.

#### Applications and Strengths

T4 templates excel in scenarios where repetitive code patterns are common, such as in:

- Data model generation based on database schemas
- Generating boilerplate code for repetitive tasks (e.g., CRUD operations)
- Automatic generation of configuration files or localization resources

The key strengths of T4 templates include:

- **Integration with Visual Studio**: They offer a seamless development experience, with Visual Studio providing direct support for creating, editing, and executing T4 templates.
- **Flexibility**: T4 templates can generate any text-based file, making them extremely versatile.
- **Customizability**: Developers have full control over the generation process, allowing for highly customized outputs based on complex logic.

#### Challenges and Limitations

Despite their strengths, T4 templates come with their own set of challenges:

- **Learning Curve**: The syntax and setup for T4 can be daunting for newcomers.
- **Debugging Difficulty**: Debugging T4 templates can be cumbersome, as it often requires attaching a debugger to the Visual Studio process.
- **Performance**: For large projects, T4 template execution can be slow, impacting overall development time.

#### The Role of T4 Templates Today

I still use T4 templates in some projects today, and they have stood the test of time, proving their worth by automating tedious coding tasks and ensuring consistency across large codebases. However, with the introduction of source generators, developers are beginning to question the future role of T4 templates in .NET development.

### Source Generators in .NET

With the release of C# 9.0 and .NET 5, the .NET ecosystem was introduced to source generators, a compelling new feature designed to enhance the developer's toolkit for code generation. Unlike T4 templates that operate outside the compilation process, source generators are intricately woven into the compilation pipeline itself. This integration allows for the dynamic generation of C# source code during compilation, effectively bridging the gap between the initial code written by developers and the final assembly produced by the compiler.

#### How Source Generators Work

Source generators work by analyzing a program's structure, including its syntax trees and semantic model, and then generating additional source files as part of the compilation process. This means the generated code is available to all subsequent phases of compilation, allowing for a seamless development experience. Developers implement source generators by creating a .NET Standard library that references `Microsoft.CodeAnalysis.CSharp` and `Microsoft.CodeAnalysis`, then implementing the [ISourceGenerator](https://learn.microsoft.com/en-us/dotnet/api/microsoft.codeanalysis.isourcegenerator?view=roslyn-dotnet-4.7.0) interface.

#### Applications and Advantages

Source generators are particularly powerful in scenarios such as:

- **Automating Boilerplate Code Generation**: Similar to T4, but integrated into the compile-time, improving build performance and developer workflow.
- **Performance Optimizations**: Generating code that is tailored for performance-critical sections, such as serialization and deserialization routines.
- **Meta-programming**: Allowing for advanced scenarios where code can be generated based on attributes, external files, or other sources of metadata.

The advantages of source generators include:

- **Compile-Time Integration**: Since source generators are part of the compilation process, they can produce code that is immediately available to other parts of the application without additional steps.
- **Performance**: They do not significantly impact the overall build time and, in some cases, can reduce runtime overhead by generating optimized code.
- **Debugging and Tooling Support**: Being a newer technology, source generators benefit from the latest IDE features, including debugging support, making them easier to work with compared to T4 templates.

#### Considerations and Best Practices

While source generators offer a powerful addition to the .NET developer’s arsenal, they come with their own considerations:

- **Complexity for Advanced Scenarios**: Writing source generators that handle complex scenarios can be challenging and requires a good understanding of Roslyn APIs.
- **Incremental Generation**: To optimize performance, developers should aim to make their generators incremental, only re-generating code when necessary.

#### The Future of Code Generation with Source Generators

As source generators continue to mature, they promise to redefine the landscape of code generation in .NET. By offering a tightly integrated, performant, and versatile solution, they may indeed pose a significant shift away from traditional methods like T4 templates, catering to modern development practices and performance needs.

### Choosing between T4 and Source Generators

The decision to use T4 templates or source generators does not have to be binary. Each tool serves its purpose and excels under different circumstances:

- **T4 Templates** may still be the tool of choice for projects that require generating non-C# files or that heavily rely on the specific templating capabilities and customizations that T4 provides. They are also beneficial in scenarios where developers are already familiar with T4 and the project's existing infrastructure is built around it.
- **Source Generators** are particularly well-suited for projects that benefit from performance optimizations at compile time, require generation of C# code based on the project's codebase itself, and aim to leverage the latest .NET features with minimal impact on the build process.

Ultimately, the choice depends on the specific needs of the project, the team's familiarity with the technologies, and the desired outcomes in terms of development efficiency and application performance.

#### Looking Ahead

As the .NET ecosystem continues to evolve, so too will the tools and methodologies for code generation. You should stay informed about the latest updates from Microsoft and the broader .NET community, as enhancements to both T4 templates and source generators are likely to expand their capabilities and use cases.

#### Additional resources

Documentation:
- [Official T4 Documentation](https://learn.microsoft.com/en-us/visualstudio/modeling/code-generation-and-t4-text-templates?view=vs-2022)
- [Official Source Generators Documentation](https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/source-generators-overview)

T4 Tools:
- [T4Editor](https://github.com/Tim-Maes/T4Editor) by me, [T4Language](https://github.com/bricelam/T4Language) by Brice Lambson
- [T4Executer](https://github.com/Tim-Maes/T4Executer) by me
- [T4Toolbox](https://github.com/olegsych/T4Toolbox) by Oleg Sych

Also check out:

- [Code Generation Fail: An all the king’s horses tragedy](https://somecallmechief.medium.com/code-generation-fail-an-all-the-kings-horses-tragedy-36dcd412ad05)
- [T4 Editors](https://medium.com/@david.zhao.blog/t4-text-template-editors-comparison-d58487db4ad3) by David Zhao
- [Unleashing the power of Source Generators](https://reynders.co/blog/unleashing-the-power-of-source-generators-in-net/)