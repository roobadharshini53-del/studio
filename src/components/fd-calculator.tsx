
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip as RechartsTooltip, Sector } from "recharts";


import { getFdTooltip } from "@/ai/flows/fd-calculator-tooltip";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CalendarDays,
  Info,
  Loader2,
  Percent,
  PiggyBank,
  RotateCcw,
  TrendingUp,
} from "lucide-react";

const formSchema = z.object({
  principal: z.coerce
    .number({ invalid_type_error: "Please enter a valid amount." })
    .positive({ message: "Amount must be positive." }),
  rate: z.coerce
    .number({ invalid_type_error: "Please enter a valid rate." })
    .min(0.1, { message: "Rate must be positive." })
    .max(100, { message: "Rate cannot exceed 100%." }),
  period: z.coerce
    .number({ invalid_type_error: "Please enter a valid period." })
    .min(0.1, { message: "Period must be positive." }),
  compounding: z.enum(["annually", "semi-annually", "quarterly", "monthly"]),
});

type FormValues = z.infer<typeof formSchema>;

interface CalculationResult {
  principal: number;
  maturityAmount: number;
  totalInterest: number;
  tooltipMessage: string | null;
}

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold text-lg">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" className="text-sm">{`₹${value.toLocaleString()}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="hsl(var(--muted-foreground))" className="text-xs">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};


export function FdCalculator() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      principal: 100000,
      rate: 6.5,
      period: 5,
      compounding: "annually",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsCalculating(true);
    setResult(null);

    const { principal, rate, period, compounding } = values;

    const n = {
      annually: 1,
      "semi-annually": 2,
      quarterly: 4,
      monthly: 12,
    }[compounding];

    const r = rate / 100;
    const t = period;

    const maturityAmount = principal * Math.pow(1 + r / n, n * t);
    const totalInterest = maturityAmount - principal;

    let tooltipMessage: string | null = null;
    try {
      const tooltipResponse = await getFdTooltip({
        fdAmount: principal,
        interestRate: rate,
        period: t,
        maturityAmount,
      });
      if (tooltipResponse.tooltipMessage) {
        tooltipMessage = tooltipResponse.tooltipMessage;
      }
    } catch (error) {
      console.error("AI Tooltip Error:", error);
    }

    setResult({ principal, maturityAmount, totalInterest, tooltipMessage });
    setIsCalculating(false);
  }

  function handleReset() {
    form.reset();
    setResult(null);
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  };
  
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const chartData = result
    ? [
        { name: "Principal", value: result.principal },
        { name: "Interest", value: result.totalInterest },
      ]
    : [];
  const COLORS = ["hsl(var(--muted))", "hsl(var(--primary))"];


  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Rooba FD Calc
            </CardTitle>
            <CardDescription>
              Calculate your Fixed Deposit returns with ease.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FD Amount (₹)</FormLabel>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          ₹
                        </span>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 100000"
                            className="pl-10"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate</FormLabel>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="e.g., 6.5"
                              className="pl-10"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period (Years)</FormLabel>
                        <div className="relative">
                          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <FormControl>
                            <Input
                              type="number"
                              step="0.5"
                              placeholder="e.g., 5"
                              className="pl-10"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="compounding"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compounding Frequency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="annually">Annually</SelectItem>
                          <SelectItem value="semi-annually">
                            Semi-annually
                          </SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex-col gap-4 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="w-full sm:w-auto"
                >
                  <RotateCcw />
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={isCalculating}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto"
                >
                  {isCalculating ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Calculate"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        {result && (
          <Card className="w-full animate-in fade-in-50">
            <CardHeader>
              <CardTitle>Calculation Results</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4 text-base">
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <span className="font-medium">Maturity Amount</span>
                    {result.tooltipMessage && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-5 w-5 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{result.tooltipMessage}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <span className="font-bold tracking-tight text-primary">
                    {formatCurrency(result.maturityAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <div className="flex items-center gap-3">
                    <PiggyBank className="h-6 w-6 text-accent" />
                    <span className="font-medium">Total Interest</span>
                  </div>
                  <span className="font-bold tracking-tight text-accent">
                    {formatCurrency(result.totalInterest)}
                  </span>
                </div>
                 <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <div className="flex items-center gap-3">
                    <PiggyBank className="h-6 w-6 text-muted-foreground" />
                    <span className="font-medium">Principal</span>
                  </div>
                  <span className="font-bold tracking-tight text-muted-foreground">
                    {formatCurrency(result.principal)}
                  </span>
                </div>
              </div>
              <div className="flex h-full min-h-[200px] items-center justify-center">
                {isClient && (
                  <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      onMouseEnter={onPieEnter}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                      ))}
                    </Pie>
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "0.875rem" }}/>
                  </PieChart>
                </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}

    