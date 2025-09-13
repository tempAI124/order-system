# AI Rules for DDAL.licious Cafe Ordering System

This document outlines the core technologies and best practices for developing the DDAL.licious application.

## Tech Stack Overview

*   **Next.js**: The application is built using Next.js, a React framework for production, enabling server-side rendering, static site generation, and API routes.
*   **React**: The primary JavaScript library for building user interfaces.
*   **TypeScript**: All components and logic are written in TypeScript for type safety and improved developer experience.
*   **Tailwind CSS**: Used exclusively for styling, providing a utility-first approach for rapid UI development and responsive design.
*   **shadcn/ui**: A collection of beautifully designed, accessible, and customizable UI components built with Radix UI and Tailwind CSS.
*   **Lucide React**: A comprehensive icon library used for all graphical icons within the application.
*   **React Hook Form & Zod**: For robust form management and validation, ensuring data integrity and a smooth user experience.
*   **Next-themes**: Manages the application's theme (light/dark mode) for user preference.
*   **Recharts**: Utilized for creating interactive charts and data visualizations in the analytics section.
*   **Sonner**: Provides elegant and accessible toast notifications for user feedback.
*   **Date-fns**: A modern JavaScript date utility library for parsing, formatting, and manipulating dates.

## Library Usage Guidelines

To maintain consistency, performance, and ease of development, please adhere to the following rules when using libraries:

*   **UI Components**: Always prioritize `shadcn/ui` components (found in `components/ui/`). If a specific component is not available or requires significant customization beyond what `shadcn/ui` offers, create a new, custom component in `components/` and style it using Tailwind CSS. **Do not modify existing `shadcn/ui` files directly.**
*   **Styling**: All styling must be done using **Tailwind CSS** classes. Avoid inline styles or custom CSS files unless absolutely necessary for very specific, non-Tailwind-compatible scenarios (which should be rare).
*   **Icons**: Use icons from the **`lucide-react`** library. Import them directly into your components.
*   **Forms**: For any form creation and management, use **`react-hook-form`** in conjunction with **`zod`** for schema validation. The `@hookform/resolvers` package should be used to integrate Zod with React Hook Form.
*   **Theme Toggling**: Use **`next-themes`** for implementing and managing light/dark mode functionality. The `ThemeProvider` and `ThemeToggle` components are already set up for this.
*   **Charts & Data Visualization**: For any charting or graphical representation of data, use **`recharts`**.
*   **Toasts/Notifications**: Implement all user notifications (e.g., success messages, error alerts) using **`sonner`**.
*   **Date Handling**: For all date and time formatting, parsing, and manipulation, use functions from **`date-fns`**.
*   **Carousels**: For any carousel or slider functionality, use **`embla-carousel-react`**.
*   **Drawers**: For slide-over panels or drawers, use **`vaul`**.
*   **Utility Functions**: For combining and merging Tailwind CSS classes, always use the `cn` utility function from `lib/utils.ts`. This function leverages `clsx` and `tailwind-merge`.
*   **File Structure**:
    *   Pages should reside in the `app/` directory following Next.js conventions.
    *   Reusable custom components should be placed in the `components/` directory.
    *   Custom React hooks should be in the `hooks/` directory.
    *   General utility functions should be in the `lib/` directory.