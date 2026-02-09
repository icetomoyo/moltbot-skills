"""
Tests for Pi Agent
Run with: python -m pytest test_pi_agent.py -v
"""

import unittest
import tempfile
import shutil
from pathlib import Path

from pi_agent import (
    Message, SessionNode, Session, 
    Tools, PiAgent
)


class TestMessage(unittest.TestCase):
    def test_message_creation(self):
        msg = Message(role='user', content='Hello')
        self.assertEqual(msg.role, 'user')
        self.assertEqual(msg.content, 'Hello')
        self.assertIsNotNone(msg.timestamp)
    
    def test_message_serialization(self):
        msg = Message(role='assistant', content='Hi', metadata={'test': True})
        data = msg.to_dict()
        restored = Message.from_dict(data)
        self.assertEqual(restored.role, 'assistant')
        self.assertEqual(restored.content, 'Hi')
        self.assertEqual(restored.metadata['test'], True)


class TestSessionNode(unittest.TestCase):
    def test_node_creation(self):
        node = SessionNode(id='abc123', parent_id=None)
        self.assertEqual(node.id, 'abc123')
        self.assertIsNone(node.parent_id)
        self.assertEqual(len(node.messages), 0)
    
    def test_node_with_messages(self):
        node = SessionNode(id='test', parent_id=None)
        node.messages.append(Message(role='user', content='Test'))
        self.assertEqual(len(node.messages), 1)


class TestSession(unittest.TestCase):
    def setUp(self):
        self.session = Session(
            id='sess123',
            root_id='root456',
            current_node_id='root456'
        )
        self.session.nodes['root456'] = SessionNode(id='root456', parent_id=None)
    
    def test_session_creation(self):
        self.assertEqual(self.session.id, 'sess123')
        self.assertEqual(self.session.current_node_id, 'root456')
    
    def test_add_message(self):
        self.session.add_message(Message(role='user', content='Hello'))
        self.assertEqual(len(self.session.current_node().messages), 1)
    
    def test_branch(self):
        # Add a message first
        self.session.add_message(Message(role='user', content='Test'))
        
        # Create branch
        new_id = self.session.branch()
        self.assertIn(new_id, self.session.nodes)
        self.assertEqual(self.session.current_node_id, new_id)
        self.assertEqual(self.session.current_node().parent_id, 'root456')
    
    def test_rewind(self):
        # Create branch
        new_id = self.session.branch()
        
        # Rewind to root
        self.assertTrue(self.session.rewind('root456'))
        self.assertEqual(self.session.current_node_id, 'root456')
        
        # Rewind to non-existent
        self.assertFalse(self.session.rewind('nonexistent'))
    
    def test_get_path_to_root(self):
        # root -> child -> grandchild
        child_id = self.session.branch('root456')
        grandchild_id = self.session.branch(child_id)
        
        path = self.session.get_path_to_root(grandchild_id)
        self.assertEqual(len(path), 3)
        self.assertEqual(path[0].id, 'root456')
        self.assertEqual(path[1].id, child_id)
        self.assertEqual(path[2].id, grandchild_id)
    
    def test_serialization(self):
        self.session.add_message(Message(role='user', content='Test'))
        data = self.session.to_dict()
        restored = Session.from_dict(data)
        self.assertEqual(restored.id, self.session.id)
        self.assertEqual(len(restored.get_all_messages()), 1)


class TestTools(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.test_file = Path(self.temp_dir) / 'test.txt'
    
    def tearDown(self):
        shutil.rmtree(self.temp_dir)
    
    def test_read_nonexistent(self):
        result = Tools.read(str(self.test_file))
        self.assertIn('Error', result)
    
    def test_write_and_read(self):
        content = 'Hello, World!'
        result = Tools.write(str(self.test_file), content)
        self.assertIn('Successfully', result)
        
        read_content = Tools.read(str(self.test_file))
        self.assertEqual(read_content, content)
    
    def test_edit(self):
        # Write initial content
        Tools.write(str(self.test_file), 'Hello, World!')
        
        # Edit
        result = Tools.edit(str(self.test_file), 'World', 'Pi')
        self.assertIn('Successfully', result)
        
        # Verify
        content = Tools.read(str(self.test_file))
        self.assertEqual(content, 'Hello, Pi!')
    
    def test_edit_not_found(self):
        Tools.write(str(self.test_file), 'Hello')
        result = Tools.edit(str(self.test_file), 'NotFound', 'Replacement')
        self.assertIn('Error', result)
    
    def test_bash(self):
        result = Tools.bash('echo "test"')
        self.assertIn('test', result)
    
    def test_bash_cwd(self):
        result = Tools.bash('pwd', cwd=self.temp_dir)
        self.assertIn(self.temp_dir, result)


class TestPiAgent(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.agent = PiAgent(workspace=self.temp_dir)
    
    def tearDown(self):
        shutil.rmtree(self.temp_dir)
    
    def test_agent_creation(self):
        self.assertIsNotNone(self.agent)
        self.assertEqual(len(self.agent.tools), 4)
        self.assertIn('read', self.agent.tools)
        self.assertIn('write', self.agent.tools)
        self.assertIn('edit', self.agent.tools)
        self.assertIn('bash', self.agent.tools)
    
    def test_create_session(self):
        session = self.agent.create_session('test')
        self.assertIsNotNone(session)
        self.assertEqual(session.name, 'test')
        self.assertIsNotNone(self.agent.current_session)
    
    def test_save_and_load_session(self):
        # Create and save
        self.agent.create_session('test')
        self.agent.current_session.add_message(Message(role='user', content='Hello'))
        result = self.agent.save_session()
        self.assertIn('saved', result.lower())
        
        # Load
        session_id = self.agent.current_session.id
        self.agent.current_session = None
        result = self.agent.load_session(session_id)
        self.assertIsNotNone(result)
        self.assertEqual(len(result.get_all_messages()), 1)
    
    def test_branch_command(self):
        self.agent.create_session()
        result = self.agent.cmd_branch('')
        self.assertIn('Created branch', result)
    
    def test_tree_command(self):
        self.agent.create_session()
        self.agent.cmd_branch('')  # Create branch
        result = self.agent.cmd_show_tree('')
        self.assertIn('Session Tree', result)
        self.assertIn(self.agent.current_session.root_id, result)
    
    def test_summary_command(self):
        self.agent.create_session('test-session')
        result = self.agent.cmd_summary('')
        self.assertIn('test-session', result)
        self.assertIn('Total Nodes', result)


class TestIntegration(unittest.TestCase):
    """Integration tests"""
    
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.agent = PiAgent(workspace=self.temp_dir)
    
    def tearDown(self):
        shutil.rmtree(self.temp_dir)
    
    def test_full_workflow(self):
        """Test a complete workflow"""
        # Create session
        self.agent.create_session('workflow-test')
        
        # Add messages
        self.agent.process_message("Hello, Pi!")
        self.agent.process_message("Create a test file")
        
        # Create branch
        self.agent.cmd_branch('')
        
        # Add more messages
        self.agent.process_message("Branch message")
        
        # Rewind to root
        root_id = self.agent.current_session.root_id
        self.agent.cmd_rewind(root_id)
        
        # Check path
        path = self.agent.current_session.get_path_to_root()
        self.assertEqual(len(path), 1)  # Just root
        
        # Save
        self.agent.save_session()


if __name__ == '__main__':
    unittest.main()
