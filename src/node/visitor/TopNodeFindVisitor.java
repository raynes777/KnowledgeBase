package node.visitor;

import node.DocumentNode;
import node.Node;
import node.RootNode;

public class TopNodeFindVisitor implements NodeVisitor<Node> {

	@Override
	public Node visitDocumentNode(DocumentNode n) {
		if (n.parent().equals(RootNode.getInstance())) {
			return n;
		} 
		
		return n.parent().accept(this);
	}
	@Override
	public Node visitRootNode(RootNode n) {
		return n;
	}

	public static TopNodeFindVisitor get() {
		return new TopNodeFindVisitor();
	}

}
