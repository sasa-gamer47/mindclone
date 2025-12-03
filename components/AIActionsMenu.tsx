import React, { useState, useRef, useEffect } from 'react';
import { Memory, MemoryType, AiAction } from '../types';
import { WandIcon } from './icons';

interface AIActionsMenuProps {
    memory: Memory;
    onAction: (action: AiAction, options?: { [key: string]: string }) => void;
    disabled: boolean;
}

const rewriteTones = ['Formal', 'Casual', 'Poetic'];
const translateLanguages = ['Spanish', 'French', 'Japanese'];

export default function AIActionsMenu({ memory, onAction, disabled }: AIActionsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [subMenu, setSubMenu] = useState<'rewrite' | 'translate' | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSubMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleAction = (action: AiAction, options?: { [key: string]: string }) => {
        onAction(action, options);
        setIsOpen(false);
        setSubMenu(null);
    };

    const handleMainMenuClick = (action: AiAction) => {
        if (action === AiAction.REWRITE || action === AiAction.TRANSLATE) {
            setSubMenu(action);
        } else {
            handleAction(action);
        }
    }
    
    const MainMenuButton: React.FC<{action: AiAction, label: string}> = ({ action, label }) => (
        <button onClick={() => handleMainMenuClick(action)} className="block w-full text-left px-4 py-2 text-sm text-loblolly hover:bg-science-blue hover:text-white">
            {label}
        </button>
    );

    const renderMainMenu = () => (
        <>
            {memory.type === MemoryType.TEXT && (
                 <>
                    <MainMenuButton action={AiAction.SMART_SUMMARY} label="Generate Smart Summary"/>
                    <MainMenuButton action={AiAction.CONTINUE_WRITING} label="Continue Writing"/>
                    <hr className="border-gray-700 my-1"/>
                    <MainMenuButton action={AiAction.REWRITE} label="Rewrite..."/>
                    <MainMenuButton action={AiAction.TRANSLATE} label="Translate..."/>
                    <MainMenuButton action={AiAction.EXTRACT} label="Extract Key Info"/>
                    <MainMenuButton action={AiAction.IDEAS} label="Generate Ideas"/>
                    <MainMenuButton action={AiAction.PLAN_TRIP} label="Plan a Trip"/>
                 </>
            )}
             {memory.type === MemoryType.LINK && (
                 <>
                    <MainMenuButton action={AiAction.SMART_SUMMARY} label="Generate Smart Summary"/>
                    <MainMenuButton action={AiAction.PLAN_TRIP} label="Plan a Trip"/>
                 </>
            )}
            {memory.type === MemoryType.IMAGE && (
                <>
                    <MainMenuButton action={AiAction.ANALYZE_IMAGE} label="Analyze Image"/>
                    <MainMenuButton action={AiAction.STORY} label="Generate Story"/>
                </>
            )}
            <hr className="border-gray-700 my-1"/>
            <MainMenuButton action={AiAction.FIND_RELATED} label="Find Related Memories"/>
        </>
    );

    const renderSubMenu = () => {
        const backButton = <button onClick={() => setSubMenu(null)} className="block w-full text-left px-4 py-2 text-sm font-bold text-loblolly hover:bg-gray-700">← Back</button>;
        if (subMenu === 'rewrite') {
            return <>
                {backButton}
                {rewriteTones.map(tone => (
                    <button key={tone} onClick={() => handleAction(AiAction.REWRITE, { tone })} className="block w-full text-left px-4 py-2 text-sm text-loblolly hover:bg-science-blue hover:text-white">
                        {tone}
                    </button>
                ))}
            </>;
        }
        if (subMenu === 'translate') {
            return <>
                {backButton}
                {translateLanguages.map(language => (
                    <button key={language} onClick={() => handleAction(AiAction.TRANSLATE, { language })} className="block w-full text-left px-4 py-2 text-sm text-loblolly hover:bg-science-blue hover:text-white">
                        {language}
                    </button>
                ))}
            </>;
        }
        return null;
    }


    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="flex items-center space-x-2 px-3 py-2 bg-shark border border-gray-700 rounded-md text-sm font-medium text-loblolly hover:bg-gray-700 disabled:opacity-50"
            >
                <WandIcon className="w-4 h-4" />
                <span>AI Actions</span>
            </button>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-shark ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                    <div className="py-1">
                        {subMenu ? renderSubMenu() : renderMainMenu()}
                    </div>
                </div>
            )}
        </div>
    );
}