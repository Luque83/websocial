import type { MDXComponents } from "mdx/types";

// Global MDX component overrides — applied to ALL .mdx files
// Maps markdown elements to styled React components
const components: MDXComponents = {
  // Headings with anchor IDs for deep linking
  h2: ({ children, ...props }) => (
    <h2
      id={
        typeof children === "string"
          ? children.toLowerCase().replace(/\s+/g, "-")
          : undefined
      }
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      id={
        typeof children === "string"
          ? children.toLowerCase().replace(/\s+/g, "-")
          : undefined
      }
      {...props}
    >
      {children}
    </h3>
  ),
  // External links open in new tab
  a: ({ href, children, ...props }) => {
    const isExternal = href?.startsWith("http");
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
      </a>
    );
  },
};

export function useMDXComponents(): MDXComponents {
  return components;
}
