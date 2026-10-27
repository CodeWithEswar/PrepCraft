"use client"
import { Accordion,AccordionItem,AccordionTrigger,AccordionContent } from "@/components/ui/accordion"
export function InterviewFold({answer}:{answer:string}){return <Accordion><AccordionItem value="answer"><AccordionTrigger>A structured explanation</AccordionTrigger><AccordionContent><p>{answer}</p></AccordionContent></AccordionItem></Accordion>}
