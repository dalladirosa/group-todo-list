'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';
import { client } from '@/lib/api';
import { Schema } from '@/amplify/data/resource';

// Add props interface
interface SidebarProps {
  onGroupSelect: (groupId: string) => void;
}

export default function Sidebar({ onGroupSelect }: SidebarProps) {
  const { user, signOut } = useAuthenticator();
  const [groupName, setGroupName] = useState('');
  const [myGroups, setMyGroups] = useState<Schema['Group']['type'][]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Fetch user's groups on component mount
  useEffect(() => {
    if (user) {
      loadUserGroups();
    }
  }, [user]);

  const loadUserGroups = async () => {
    try {
      const member = await client.models.Member.list({
        filter: { userId: { eq: user?.userId } }
      }).then((res) => res.data[0]);

      if (!member) return;

      const groupMembers = await client.models.GroupMember.list({
        filter: { memberId: { eq: member.id } }
      }).then((res) => res.data);

      if (!groupMembers) return;

      const groups = await client.models.Group.list({
        filter: {
          or: groupMembers.map((gm) => ({ id: { eq: gm.groupId } }))
        }
      }).then((res) => res.data);

      setMyGroups(groups);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !user) return;

    try {
      // Get or create member
      const [member] = await client.models.Member.list({
        filter: { userId: { eq: user.userId } }
      }).then((res) => res.data);

      const memberId =
        member?.id ??
        (await client.models.Member.create({
          userId: user.userId
        }));

      const [group] = await client.models.Group.list({
        filter: { name: { eq: groupName } }
      }).then((res) => res.data);

      console.log({ group });

      const groupId =
        group?.id ??
        (await client.models.Group.create({
          name: groupName
        }));

      const [existingRelation] = await client.models.GroupMember.list({
        filter: {
          and: [{ groupId: { eq: groupId } }, { memberId: { eq: memberId } }]
        }
      }).then((res) => res.data);

      if (!existingRelation) {
        await client.models.GroupMember.create({
          // @ts-ignore
          groupId: groupId?.data?.id || groupId,
          // @ts-ignore
          memberId: memberId?.data?.id || memberId
        });
      }

      await loadUserGroups();
      setGroupName('');
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    onGroupSelect(groupId);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.section}>
        <h2>Signed in as</h2>
        <p>{user?.signInDetails?.loginId}</p>
        <button onClick={signOut} className={styles.button}>
          Sign out
        </button>
      </div>

      <div className={styles.section}>
        <h2>Join group</h2>
        <form onSubmit={handleJoinGroup}>
          <input
            type='text'
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder='Enter group name'
            className={styles.input}
          />
          <button type='submit' className={styles.button}>
            Join group
          </button>
        </form>
      </div>

      <div className={styles.section}>
        <h2>My groups</h2>
        <div className={styles.groupsList}>
          {myGroups.map((group) => (
            <div
              key={group.id}
              className={`${styles.groupItem} ${
                selectedGroupId === group.id ? styles.selected : ''
              }`}
              onClick={() => handleGroupSelect(group.id)}
            >
              {group.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
