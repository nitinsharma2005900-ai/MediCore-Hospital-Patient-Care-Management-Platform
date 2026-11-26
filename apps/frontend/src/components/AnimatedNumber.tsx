'use client';
import {useEffect} from 'react';
import {motion,useMotionValue,useSpring,useTransform,useReducedMotion} from 'framer-motion';
export function AnimatedNumber({value,decimals=0}:{value:number;decimals?:number}){
 const raw=useMotionValue(0);const spring=useSpring(raw,{stiffness:100,damping:24});const display=useTransform(spring,n=>n.toFixed(decimals));const reduced=useReducedMotion();
 useEffect(()=>{raw.set(value);},[value,raw]);
 return <span aria-label={value.toFixed(decimals)}>{reduced?value.toFixed(decimals):<motion.span aria-hidden="true">{display}</motion.span>}</span>;
}
