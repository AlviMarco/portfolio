
"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import styles from './Admin.module.css';

const Admin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Project Form State
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [link, setLink] = useState('');
    const [tech, setTech] = useState('');
    const [projects, setProjects] = useState<any[]>([]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'admin' && password === 'admin123') {
            setIsAuthenticated(true);
            fetchProjects();
        } else {
            alert('Invalid credentials');
        }
    };

    const fetchProjects = async () => {
        const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (data) setProjects(data);
    };

    const handleAddProject = async (e: React.FormEvent) => {
        e.preventDefault();
        const techArray = tech.split(',').map(t => t.trim());
        const { error } = await supabase.from('projects').insert([{
            title,
            description: desc,
            live_link: link,
            tech: techArray
        }]);

        if (error) alert(error.message);
        else {
            alert('Project Added!');
            setTitle(''); setDesc(''); setLink(''); setTech('');
            fetchProjects();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchProjects();
    };

    if (!isAuthenticated) {
        return (
            <div className={styles.loginContainer}>
                <form onSubmit={handleLogin} className={`glass-panel ${styles.loginForm}`}>
                    <h2>Admin Login</h2>
                    <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className={styles.input} />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className={styles.input} />
                    <button type="submit" className={styles.btn}>Login</button>
                    <p className={styles.hint}>Tip: admin / admin123</p>
                </form>
            </div>
        );
    }

    return (
        <div className={`container ${styles.dashboard}`}>
            <h1 className={styles.title}>Admin Dashboard</h1>

            <div className={styles.grid}>
                <div className={`glass-panel ${styles.formCard}`}>
                    <h3>Add New Project</h3>
                    <form onSubmit={handleAddProject}>
                        <div className={styles.formGroup}>
                            <label>Title</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} className={styles.input} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea value={desc} onChange={e => setDesc(e.target.value)} className={styles.textarea} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Live Link</label>
                            <input value={link} onChange={e => setLink(e.target.value)} className={styles.input} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Tech Stack (comma separated)</label>
                            <input value={tech} onChange={e => setTech(e.target.value)} className={styles.input} placeholder="React, Node, Utils" />
                        </div>
                        <button type="submit" className={styles.btn}>Add Project</button>
                    </form>
                </div>

                <div className={styles.listCard}>
                    <h3>Existing Projects</h3>
                    <div className={styles.projectList}>
                        {projects.map(p => (
                            <div key={p.id} className={`glass-panel ${styles.projectItem}`}>
                                <div>
                                    <h4>{p.title}</h4>
                                    <small>{p.description?.substring(0, 50)}...</small>
                                </div>
                                <button onClick={() => handleDelete(p.id)} className={styles.deleteBtn}>Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
