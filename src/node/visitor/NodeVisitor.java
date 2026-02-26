package node.visitor;
import node.DocumentNode;
import node.RootNode;


public abstract interface NodeVisitor<T>{

	public abstract T visitDocumentNode(DocumentNode n);
	public abstract T visitRootNode(RootNode n);
	
	
}
