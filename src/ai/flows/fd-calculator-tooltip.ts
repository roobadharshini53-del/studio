'use server';

/**
 * @fileOverview This file implements the AI-powered tooltip for the FD calculator.
 *
 * It checks if the calculated maturity amount is unusually high or low compared to prevailing rates
 * and provides a tooltip explaining potential input errors.
 *
 * - `getFdTooltip` - A function that returns a tooltip message if the calculated maturity amount is unusual.
 * - `FdTooltipInput` - The input type for the `getFdTooltip` function.
 * - `FdTooltipOutput` - The return type for the `getFdTooltip` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const FdTooltipInputSchema = z.object({
  fdAmount: z.number().describe('The fixed deposit amount.'),
  interestRate: z.number().describe('The interest rate (in percentage).'),
  period: z.number().describe('The period of the fixed deposit in years.'),
  maturityAmount: z.number().describe('The calculated maturity amount.'),
});
export type FdTooltipInput = z.infer<typeof FdTooltipInputSchema>;

// Define the output schema
const FdTooltipOutputSchema = z.object({
  tooltipMessage: z.string().describe('The tooltip message to display, if any.'),
});
export type FdTooltipOutput = z.infer<typeof FdTooltipOutputSchema>;

// Define the tool to get prevailing interest rates
const getPrevailingInterestRate = ai.defineTool(
  {
    name: 'getPrevailingInterestRate',
    description: 'Returns the prevailing interest rate for fixed deposits.',
    inputSchema: z.object({
      period: z.number().describe('The period of the fixed deposit in years.'),
    }),
    outputSchema: z.number().describe('The prevailing interest rate (in percentage).'),
  },
  async input => {
    // TODO: Implement the logic to fetch prevailing interest rates based on the period.
    // This is a placeholder implementation. Replace with actual data fetching.
    console.log(`CALLING getPrevailingInterestRate with period=${input.period}`);
    if (input.period <= 1) {
      return 5;
    } else if (input.period <= 3) {
      return 6;
    } else {
      return 7;
    }
  }
);

// Define the prompt
const fdTooltipPrompt = ai.definePrompt({
  name: 'fdTooltipPrompt',
  input: {schema: FdTooltipInputSchema},
  output: {schema: FdTooltipOutputSchema},
  tools: [getPrevailingInterestRate],
  prompt: `You are an expert financial advisor. A user has calculated the maturity amount of a fixed deposit. Your job is to determine if the calculated maturity amount is unusually high or low compared to prevailing rates, and if so, provide a tooltip message explaining potential input errors.

Here are the details of the fixed deposit:
- FD Amount: {{{fdAmount}}}
- Interest Rate: {{{interestRate}}}
- Period: {{{period}}}
- Calculated Maturity Amount: {{{maturityAmount}}}

First, use the getPrevailingInterestRate tool to get the prevailing interest rate for fixed deposits with a period of {{{period}}} years.

Then, compare the user's interest rate to the prevailing interest rate. If the user's interest rate is significantly different (more than 2 percentage points) from the prevailing rate, or if the calculated maturity amount seems incorrect based on a simple calculation (maturityAmount = fdAmount * (1 + interestRate/100 * period)), then generate a tooltip message suggesting the user double-check their inputs. Otherwise, return an empty tooltip message.

Keep the tooltip message concise and easy to understand. Be polite and helpful.

Example tooltip message: "The calculated maturity amount seems unusually high. Please double-check the interest rate and period you entered, as they may not be accurate."

If everything seems normal, the tooltipMessage should be an empty string.
`,
});

// Define the flow
const fdTooltipFlow = ai.defineFlow(
  {
    name: 'fdTooltipFlow',
    inputSchema: FdTooltipInputSchema,
    outputSchema: FdTooltipOutputSchema,
  },
  async input => {
    const {output} = await fdTooltipPrompt(input);
    return output!;
  }
);

/**
 * Checks if the calculated maturity amount is unusually high or low and provides a tooltip message.
 * @param input - The input containing FD details.
 * @returns A promise that resolves to an FdTooltipOutput object.
 */
export async function getFdTooltip(input: FdTooltipInput): Promise<FdTooltipOutput> {
  return fdTooltipFlow(input);
}

