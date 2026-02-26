package node.visitor;

import node.DocumentNode;
import node.Node;
import node.RootNode;
import content.Author;

public class AuthorVisitor implements NodeVisitor<Node>{
	
	private Author author;
	
	private AuthorVisitor(Author a) {
		this.author = a;
	}

	@Override
	public Node visitDocumentNode(DocumentNode n) {
		if (!(hasAuthor(n))) {
			return n.parent().accept(this);
		}
		
		return n;
	}

	@Override
	public Node visitRootNode(RootNode n) {
		return n;
	}

	private boolean hasAuthor(Node n) {
		return this.author.equals(n.content().author()) ? true : false;
	}
	
	public static AuthorVisitor withAuthor(Author a) {
		return new AuthorVisitor(a);
	}

}
