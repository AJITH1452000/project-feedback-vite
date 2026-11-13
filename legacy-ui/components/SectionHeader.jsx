import { Button } from '@mui/material';
import { Plus } from 'lucide-react';
export default function SectionHeader({eyebrow,title,description,action,actionLabel='Create project',onAction}){return <div className="section-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action&&<Button variant="contained" startIcon={<Plus size={17}/>} onClick={onAction}>{actionLabel}</Button>}</div>}
