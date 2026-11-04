import { z } from 'zod';
export const today = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const date = z.string().refine(v => v === '' || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v), 'Use a valid date');
const pastDate = date.refine(v=>v === '' || v <= today(), 'Recorded dates cannot be in the future');
const recordedDate=pastDate.refine(v=>v!=='','A recorded date is required');
const number = z.number().finite().min(0).max(2000000);
const id = z.string().min(1).max(100);
const note = z.string().max(3000);
export const checkKeys = ['tyres','brakes','chain','oil','lights','luggage','kit','route'] as const;
export type CheckKey = typeof checkKeys[number];
export const checkInfo: Record<CheckKey,{title:string;detail:string;priority:string}> = {
 tyres:{title:'Tyres & cold pressures',detail:'Inspect both tyres, tread and damage. Verify cold pressures for your load against the bike label or owner’s manual.',priority:'Critical'},
 brakes:{title:'Brakes & controls',detail:'Check front and rear brake operation, pad condition, fluid, throttle and clutch. Resolve faults before riding.',priority:'Critical'},
 chain:{title:'Chain & sprockets',detail:'Check lubrication, wear and slack against your manual. Recheck after wet or dusty riding.',priority:'Critical'},
 oil:{title:'Engine oil & leaks',detail:'Check the oil level using the manual’s procedure. Inspect for leaks and warning lights.',priority:'Critical'},
 lights:{title:'Lights, horn & signals',detail:'Test headlight, brake light, indicators and horn. Confirm mirrors are secure.',priority:'Essential'},
 luggage:{title:'Luggage & riding gear',detail:'Secure luggage, check load limits and suspension setup. Check helmet, gloves and riding gear.',priority:'Essential'},
 kit:{title:'Documents & essentials',detail:'Confirm documents, fuel, water, puncture kit, charged phone and roadside assistance details.',priority:'Essential'},
 route:{title:'Route, weather & rest stops',detail:'Check current route restrictions and weather. Choose fuel and rest stops and share your itinerary.',priority:'Planning'}
};
export const checkSchema = z.object({status:z.enum(['unknown','ok','issue']),date:pastDate,notes:note,frontPsi:number.nullable().optional(),rearPsi:number.nullable().optional(),frontTread:number.nullable().optional(),rearTread:number.nullable().optional(),slack:number.nullable().optional()});
export type Inspection = z.infer<typeof checkSchema>;
const checks = z.record(z.enum(checkKeys),checkSchema);
export const settingsSchema = z.object({purchaseDate:pastDate,serviceKm:number.nullable(),serviceDate:date,serviceConfirmed:z.boolean(),freshDays:z.number().int().min(1).max(30),monthlyDay:z.number().int().min(1).max(28)});
export const serviceSchema = z.object({id,date:recordedDate,km:number,type:z.enum(['Periodic service','Oil & filter','Chain care','Tyres','Repair / other']),work:note,workshop:z.string().max(200),cost:number.nullable()});
export const tripSchema = z.object({id,origin:z.string().min(1).max(100),destination:z.string().min(1).max(100),date:date.refine(v=>v!=='','Choose a departure date'),returnDate:date,distance:z.number().positive().max(50000),roundTrip:z.boolean(),distanceConfirmed:z.boolean(),load:z.enum(['Solo','Solo + luggage','Pillion + luggage']),status:z.enum(['planned','completed','cancelled']),notes:note,checks}).refine(t=>!t.roundTrip||(t.returnDate!==''&&t.returnDate>=t.date),'Round trips need a return date on or after departure');
export const reminderSchema=z.object({id,title:z.string().min(1).max(100),days:z.number().int().min(1).max(3650).nullable(),km:z.number().int().min(1).max(100000).nullable(),lastDate:pastDate,lastKm:number.nullable(),confirmed:z.boolean()}).refine(v=>v.days!==null||v.km!==null,'Set a distance or time interval');
export const bookSchema=z.object({readings:z.array(z.object({id,km:number,date:recordedDate,note})).max(1000),services:z.array(serviceSchema).max(1000),trips:z.array(tripSchema).max(500),inspections:checks,reminders:z.array(reminderSchema).max(100),reviews:z.array(z.object({id,date:recordedDate,km:number,notes:note,openIssues:z.number().int().min(0),nextDue:date})).max(200),settings:settingsSchema});
export type Book=z.infer<typeof bookSchema>;
export type Trip=z.infer<typeof tripSchema>;
export type Reminder=z.infer<typeof reminderSchema>;
export type Service=z.infer<typeof serviceSchema>;
export const emptyCheck = ():Inspection=>({status:'unknown',date:'',notes:''});
export const defaultBook=():Book=>({readings:[],services:[],trips:[],inspections:{},reviews:[],reminders:[{id:'chain-care',title:'Clean & lubricate chain',days:null,km:500,lastDate:'',lastKm:null,confirmed:false},{id:'monthly-walkaround',title:'Battery & fastener inspection',days:30,km:null,lastDate:'',lastKm:null,confirmed:false}],settings:{purchaseDate:'',serviceKm:null,serviceDate:'',serviceConfirmed:false,freshDays:7,monthlyDay:1}});
export function daysBetween(a:string,b:string){return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000)}
export function addDays(date:string,days:number){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function nextReviewDate(day:number,from=today()){let d=new Date(from+'T12:00:00Z');if(d.getUTCDate()>=day)d.setUTCMonth(d.getUTCMonth()+1,1);d.setUTCDate(day);return d.toISOString().slice(0,10)}
export function odoState(b:Book,now=today()){const reading=b.readings[0];if(!reading)return {reading,stale:true,reason:'Add an odometer reading'};if(b.services.some(x=>x.km>reading.km))return {reading,stale:true,reason:'A service record exceeds this reading'};const stale=daysBetween(reading.date,now)>b.settings.freshDays;return {reading,stale,reason:stale?'Fresh odometer reading needed':'Recorded '+reading.date};}
export function serviceState(b:Book,now=today()){
 const {serviceKm:km,serviceDate:date,serviceConfirmed:confirmed}=b.settings;const o=odoState(b,now);
 if(!confirmed||km===null||!date)return {level:'unknown',label:'Set service baseline',detail:'Confirm the next distance and date from your service record.'};
 if(date<=now)return {level:'due',label:'Service due by date',detail:'Your confirmed date has been reached. Arrange service.'};
 if(o.stale)return {level:'unknown',label:'Fresh reading needed',detail:'Date target is saved; distance status is unverified.'};
 const remaining=km-o.reading!.km;
 if(remaining<=0)return {level:'due',label:'Service due',detail:`${Math.abs(remaining).toLocaleString('en-IN')} km past your confirmed target.`};
 if(remaining<=500||daysBetween(now,date)<=14)return {level:'soon',label:'Service coming up',detail:`${remaining.toLocaleString('en-IN')} km remaining · whichever comes first.`};
 return {level:'ok',label:'On your service plan',detail:`${remaining.toLocaleString('en-IN')} km remaining · recheck as you ride.`};
}
export function inspectionState(c:Inspection|undefined,now=today(),maxDays=0){if(c?.status==='issue')return 'issue';if(!c||c.status==='unknown'||!c.date||daysBetween(c.date,now)>maxDays)return 'unknown';return 'ok'}
export function projectedKm(b:Book,trip:Trip,now=today()){const o=odoState(b,now);if(o.stale||!o.reading||!trip.distanceConfirmed)return null;const prior=b.trips.filter(t=>t.id!==trip.id&&t.status==='planned'&&t.date>=now&&t.date<=trip.date);if(prior.some(t=>!t.distanceConfirmed))return null;return o.reading.km+[...prior,trip].reduce((s,t)=>s+t.distance*(t.roundTrip?2:1),0);}
export function readiness(b:Book,trip?:Trip,now=today()){
 const list=trip?trip.checks:b.inspections;
 const confirmed=checkKeys.filter(k=>inspectionState(list[k],now)==='ok'&&b.inspections[k]?.status!=='issue').length;
 const issues=checkKeys.filter(k=>list[k]?.status==='issue'||b.inspections[k]?.status==='issue').length;
 const gaps:string[]=[];const o=odoState(b,now),s=serviceState(b,now);
 if(o.stale||o.reading?.date!==now)gaps.push('Record today’s odometer');
 if(s.level!=='ok'&&s.level!=='soon')gaps.push(s.level==='due'?'Service is due':'Confirm service baseline');
 if(trip&&!trip.distanceConfirmed)gaps.push('Confirm route distance');
 if(trip&&trip.date<now)gaps.push('Update this trip’s date or status');
 if(trip&&trip.date>now)gaps.push('Recheck on departure day');
 if(trip&&trip.distanceConfirmed&&!o.stale&&o.reading&&b.settings.serviceConfirmed){const end=projectedKm(b,trip,now);if(end!==null&&b.settings.serviceKm!==null&&end>=b.settings.serviceKm)gaps.push('Trip reaches service mileage');if(b.settings.serviceDate&&(trip.returnDate||trip.date)>=b.settings.serviceDate)gaps.push('Service date falls before trip ends');}
 if(b.reminders.some(r=>reminderState(b,r,now).level==='due'))gaps.push('Review due maintenance reminders');
 if(trip&&trip.distanceConfirmed&&!o.stale&&projectedKm(b,trip,now)===null)gaps.push('Confirm earlier trip distances');
 if(issues)gaps.unshift(`${issues} issue${issues>1?'s':''} to resolve`);
 return {confirmed,issues,gaps,label:issues?'Resolve before riding':confirmed===8&&gaps.length===0?'Checks complete for today':'Manual checks needed'};
}
export function reminderState(b:Book,r:Reminder,now=today()){
 if(!r.confirmed)return {level:'unknown',label:'Confirm interval'};
 if((r.days&&!r.lastDate)||(r.km&&r.lastKm===null))return {level:'unknown',label:'Add completion baseline'};
 const o=odoState(b,now);if(r.days&&addDays(r.lastDate,r.days)<=now)return {level:'due',label:'Due by date'};
 if(r.km){if(o.stale)return {level:'unknown',label:'Fresh reading needed'};if(o.reading!.km<r.lastKm!)return {level:'unknown',label:'Check odometer baseline'};if(o.reading!.km>=r.lastKm!+r.km)return {level:'due',label:'Due by distance'};}
 return {level:'ok',label:'Scheduled'};
}
